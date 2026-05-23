//! Persisted report drafts with per-section status and regen merge rules.

use crate::reports::{self, ReportDocument, ReportSection, StandardsComplianceCheck};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ReportSectionStatus {
    Empty,
    AiDrafted,
    Edited,
    Reviewed,
    Locked,
}

impl ReportSectionStatus {
    pub fn from_str(s: &str) -> Self {
        match s {
            "aiDrafted" | "ai_drafted" => Self::AiDrafted,
            "edited" => Self::Edited,
            "reviewed" => Self::Reviewed,
            "locked" => Self::Locked,
            _ => Self::Empty,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Empty => "empty",
            Self::AiDrafted => "aiDrafted",
            Self::Edited => "edited",
            Self::Reviewed => "reviewed",
            Self::Locked => "locked",
        }
    }

    /// Sections with these statuses may be replaced during regeneration.
    pub fn is_replaceable_on_regen(&self) -> bool {
        matches!(self, Self::Empty | Self::AiDrafted | Self::Reviewed)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportDraft {
    pub id: String,
    pub case_id: String,
    pub template_id: String,
    pub document: ReportDocument,
    pub section_status: HashMap<String, ReportSectionStatus>,
    pub generated_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportSnapshot {
    pub id: String,
    pub case_id: String,
    pub template_id: String,
    pub label: String,
    pub document: ReportDocument,
    pub section_status: HashMap<String, ReportSectionStatus>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegenerateScope {
    pub scope: String,
    pub section_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceScanItem {
    pub id: String,
    pub label: String,
    pub passed: bool,
    pub detail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportComplianceScan {
    pub ok: bool,
    pub items: Vec<ComplianceScanItem>,
}

fn status_map_to_json(map: &HashMap<String, ReportSectionStatus>) -> Result<String, String> {
    let raw: HashMap<String, String> = map
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().to_string()))
        .collect();
    serde_json::to_string(&raw).map_err(|e| e.to_string())
}

fn status_map_from_json(json: &str) -> Result<HashMap<String, ReportSectionStatus>, String> {
    if json.trim().is_empty() || json == "{}" {
        return Ok(HashMap::new());
    }
    let raw: HashMap<String, String> =
        serde_json::from_str(json).map_err(|e| format!("invalid status_json: {e}"))?;
    Ok(raw
        .into_iter()
        .map(|(k, v)| (k, ReportSectionStatus::from_str(&v)))
        .collect())
}

fn default_status_for_section(section: &ReportSection) -> ReportSectionStatus {
    if section.text.trim().is_empty() {
        ReportSectionStatus::Empty
    } else {
        ReportSectionStatus::AiDrafted
    }
}

pub fn initial_status_map(document: &ReportDocument) -> HashMap<String, ReportSectionStatus> {
    document
        .sections
        .iter()
        .map(|s| (s.id.clone(), default_status_for_section(s)))
        .collect()
}

pub fn merge_regenerated_sections(
    existing: &ReportDraft,
    regenerated: ReportDocument,
    scope: &RegenerateScope,
) -> ReportDraft {
    let mut merged = existing.clone();
    merged.document.generated_at = regenerated.generated_at.clone();
    merged.document.compliance = regenerated.compliance.clone();

    for new_section in regenerated.sections {
        let section_id = new_section.id.clone();
        let current_status = existing
            .section_status
            .get(&section_id)
            .copied()
            .unwrap_or(ReportSectionStatus::Empty);

        let should_replace = match scope.scope.as_str() {
            "section" => {
                scope.section_id.as_deref() == Some(section_id.as_str())
                    && current_status.is_replaceable_on_regen()
            }
            "unreviewed" => matches!(
                current_status,
                ReportSectionStatus::Empty | ReportSectionStatus::AiDrafted
            ),
            _ => current_status.is_replaceable_on_regen(),
        };

        if !should_replace {
            continue;
        }

        if let Some(section) = merged.document.sections.iter_mut().find(|s| s.id == section_id) {
            section.text = new_section.text;
            section.citations = new_section.citations;
            section.standards_tags = new_section.standards_tags;
        }
        merged
            .section_status
            .insert(section_id, ReportSectionStatus::AiDrafted);
    }

    merged.document.markdown = reports::sections_to_markdown(
        &merged.document.template_id,
        &merged
            .document
            .case_id
            .chars()
            .take(1)
            .collect::<String>(), // placeholder — caller should refresh with case name
        &merged.document.generated_at,
        &merged.document.sections,
        &merged.document.compliance,
    );

    merged
}

pub fn refresh_draft_markdown(conn: &Connection, draft: &mut ReportDraft) -> Result<(), String> {
    let case_name: String = conn
        .query_row(
            "SELECT name FROM cases WHERE id = ?1",
            params![draft.case_id],
            |row| row.get(0),
        )
        .map_err(|_| "case not found".to_string())?;
    draft.document.markdown = reports::sections_to_markdown(
        &draft.document.template_id,
        &case_name,
        &draft.document.generated_at,
        &draft.document.sections,
        &draft.document.compliance,
    );
    Ok(())
}

pub fn get_draft(
    conn: &Connection,
    case_id: &str,
    template_id: &str,
) -> Result<Option<ReportDraft>, String> {
    let row = conn
        .query_row(
            "SELECT id, case_id, template_id, sections_json, compliance_json, status_json,
                generated_at, updated_at
         FROM report_drafts WHERE case_id = ?1 AND template_id = ?2",
            params![case_id, template_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let Some((
        id,
        case_id_row,
        template_id_row,
        sections_json,
        compliance_json,
        status_json,
        generated_at,
        updated_at,
    )) = row
    else {
        return Ok(None);
    };

    let sections: Vec<ReportSection> =
        serde_json::from_str(&sections_json).map_err(|e| e.to_string())?;
    let compliance: Vec<StandardsComplianceCheck> =
        serde_json::from_str(&compliance_json).map_err(|e| e.to_string())?;
    let section_status = status_map_from_json(&status_json)?;

    let mut draft = ReportDraft {
        id,
        case_id: case_id_row.clone(),
        template_id: template_id_row.clone(),
        document: ReportDocument {
            template_id: template_id_row,
            case_id: case_id_row,
            generated_at: generated_at.clone(),
            sections,
            compliance,
            markdown: String::new(),
        },
        section_status,
        generated_at,
        updated_at,
    };
    refresh_draft_markdown(conn, &mut draft)?;
    Ok(Some(draft))
}

pub fn save_draft(conn: &Connection, draft: &ReportDraft) -> Result<ReportDraft, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let id = if draft.id.is_empty() {
        uuid::Uuid::new_v4().to_string()
    } else {
        draft.id.clone()
    };
    let sections_json = serde_json::to_string(&draft.document.sections).map_err(|e| e.to_string())?;
    let compliance_json =
        serde_json::to_string(&draft.document.compliance).map_err(|e| e.to_string())?;
    let status_json = status_map_to_json(&draft.section_status)?;

    conn.execute(
        "INSERT INTO report_drafts (
            id, case_id, template_id, sections_json, compliance_json, status_json,
            generated_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ON CONFLICT(case_id, template_id) DO UPDATE SET
            sections_json = excluded.sections_json,
            compliance_json = excluded.compliance_json,
            status_json = excluded.status_json,
            generated_at = excluded.generated_at,
            updated_at = excluded.updated_at",
        params![
            id,
            draft.case_id,
            draft.template_id,
            sections_json,
            compliance_json,
            status_json,
            draft.generated_at,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_draft(conn, &draft.case_id, &draft.template_id)?
        .ok_or_else(|| "failed to reload draft".to_string())
}

pub fn update_section(
    conn: &Connection,
    case_id: &str,
    template_id: &str,
    section_id: &str,
    text: &str,
    status: ReportSectionStatus,
) -> Result<ReportDraft, String> {
    let mut draft = get_draft(conn, case_id, template_id)?
        .ok_or_else(|| "report draft not found".to_string())?;
    let section = draft
        .document
        .sections
        .iter_mut()
        .find(|s| s.id == section_id)
        .ok_or_else(|| format!("unknown section: {section_id}"))?;
    section.text = text.to_string();
    draft.section_status.insert(section_id.to_string(), status);
    refresh_draft_markdown(conn, &mut draft)?;
    save_draft(conn, &draft)
}

pub fn draft_from_document(
    case_id: &str,
    template_id: &str,
    document: ReportDocument,
    section_status: Option<HashMap<String, ReportSectionStatus>>,
) -> ReportDraft {
    let status = section_status.unwrap_or_else(|| initial_status_map(&document));
    ReportDraft {
        id: String::new(),
        case_id: case_id.to_string(),
        template_id: template_id.to_string(),
        generated_at: document.generated_at.clone(),
        updated_at: document.generated_at.clone(),
        section_status: status,
        document,
    }
}

pub fn create_snapshot(
    conn: &Connection,
    case_id: &str,
    template_id: &str,
    label: &str,
) -> Result<ReportSnapshot, String> {
    let draft = get_draft(conn, case_id, template_id)?
        .ok_or_else(|| "no draft to snapshot".to_string())?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let document_json = serde_json::to_string(&draft.document).map_err(|e| e.to_string())?;
    let status_json = status_map_to_json(&draft.section_status)?;
    conn.execute(
        "INSERT INTO report_snapshots (id, case_id, template_id, label, document_json, status_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, case_id, template_id, label, document_json, status_json, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(ReportSnapshot {
        id,
        case_id: case_id.to_string(),
        template_id: template_id.to_string(),
        label: label.to_string(),
        document: draft.document,
        section_status: draft.section_status,
        created_at: now,
    })
}

pub fn list_snapshots(
    conn: &Connection,
    case_id: &str,
    template_id: &str,
) -> Result<Vec<ReportSnapshot>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, case_id, template_id, label, document_json, status_json, created_at
             FROM report_snapshots WHERE case_id = ?1 AND template_id = ?2
             ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![case_id, template_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for row in rows.filter_map(Result::ok) {
        let (id, cid, tid, label, document_json, status_json, created_at) = row;
        let document: ReportDocument =
            serde_json::from_str(&document_json).map_err(|e| e.to_string())?;
        let section_status = status_map_from_json(&status_json)?;
        out.push(ReportSnapshot {
            id,
            case_id: cid,
            template_id: tid,
            label,
            document,
            section_status,
            created_at,
        });
    }
    Ok(out)
}

pub fn restore_snapshot(conn: &Connection, snapshot_id: &str) -> Result<ReportDraft, String> {
    let row = conn
        .query_row(
            "SELECT id, case_id, template_id, label, document_json, status_json, created_at
             FROM report_snapshots WHERE id = ?1",
            params![snapshot_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                ))
            },
        )
        .map_err(|_| "snapshot not found".to_string())?;

    let (_id, case_id, template_id, _label, document_json, status_json, _created_at) = row;
    let document: ReportDocument =
        serde_json::from_str(&document_json).map_err(|e| e.to_string())?;
    let section_status = status_map_from_json(&status_json)?;
    let draft = ReportDraft {
        id: String::new(),
        case_id: case_id.clone(),
        template_id: template_id.clone(),
        document,
        section_status,
        generated_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    save_draft(conn, &draft)
}

pub fn run_compliance_scan(
    conn: &Connection,
    case_id: &str,
    template_id: &str,
) -> Result<ReportComplianceScan, String> {
    let draft = get_draft(conn, case_id, template_id)?;
    let profile = crate::examiner_profile::get_profile(conn)?;
    let mut items = Vec::new();

    if let Some(draft) = &draft {
        let full_text: String = draft
            .document
            .sections
            .iter()
            .map(|s| s.text.as_str())
            .collect::<Vec<_>>()
            .join("\n");
        let lang_ok = reports::language_scan_passes(&full_text);
        items.push(ComplianceScanItem {
            id: "language-scan".into(),
            label: "ACFE III.C.2 / SSFS language scan".into(),
            passed: lang_ok,
            detail: if lang_ok {
                None
            } else {
                Some("Prohibited guilt/innocence or ultimate fraud phrasing detected.".into())
            },
        });

        let reviewed_count = draft
            .section_status
            .values()
            .filter(|s| matches!(s, ReportSectionStatus::Reviewed | ReportSectionStatus::Locked))
            .count();
        let total = draft.document.sections.len();
        items.push(ComplianceScanItem {
            id: "sections-reviewed".into(),
            label: "Sections reviewed or locked".into(),
            passed: reviewed_count == total,
            detail: Some(format!("{reviewed_count}/{total} sections reviewed or locked")),
        });

        let with_citations = draft
            .document
            .sections
            .iter()
            .filter(|s| !s.citations.is_empty() || s.id == "qualifications")
            .count();
        items.push(ComplianceScanItem {
            id: "citations-present".into(),
            label: "Evidence-backed sections have citations".into(),
            passed: with_citations >= draft.document.sections.len().saturating_sub(3),
            detail: None,
        });
    } else {
        items.push(ComplianceScanItem {
            id: "draft-exists".into(),
            label: "Report draft exists".into(),
            passed: false,
            detail: Some("Generate a first draft before finalizing.".into()),
        });
    }

    items.push(ComplianceScanItem {
        id: "examiner-profile".into(),
        label: "Examiner profile complete".into(),
        passed: profile.is_complete_for_compliance(),
        detail: if profile.is_complete_for_compliance() {
            None
        } else {
            Some("Fill qualifications, prior testimony, and compensation in Settings.".into())
        },
    });

    let ok = items.iter().all(|i| i.passed);
    Ok(ReportComplianceScan { ok, items })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reports::{ReportDocument, ReportSection};

    fn sample_draft() -> ReportDraft {
        let doc = ReportDocument {
            template_id: "cfe-long".into(),
            case_id: "case-1".into(),
            generated_at: "2026-01-01".into(),
            sections: vec![
                ReportSection {
                    id: "executive".into(),
                    heading: "Executive Summary".into(),
                    text: "Original executive.\n".into(),
                    citations: vec![],
                    standards_tags: vec![],
                },
                ReportSection {
                    id: "findings".into(),
                    heading: "Findings".into(),
                    text: "Edited findings.\n".into(),
                    citations: vec![],
                    standards_tags: vec![],
                },
            ],
            compliance: vec![],
            markdown: String::new(),
        };
        let mut status = initial_status_map(&doc);
        status.insert("findings".into(), ReportSectionStatus::Edited);
        ReportDraft {
            id: "d1".into(),
            case_id: "case-1".into(),
            template_id: "cfe-long".into(),
            document: doc,
            section_status: status,
            generated_at: "2026-01-01".into(),
            updated_at: "2026-01-01".into(),
        }
    }

    #[test]
    fn merge_preserves_edited_sections() {
        let existing = sample_draft();
        let regenerated = ReportDocument {
            template_id: "cfe-long".into(),
            case_id: "case-1".into(),
            generated_at: "2026-01-02".into(),
            sections: vec![
                ReportSection {
                    id: "executive".into(),
                    heading: "Executive Summary".into(),
                    text: "New executive.\n".into(),
                    citations: vec![],
                    standards_tags: vec![],
                },
                ReportSection {
                    id: "findings".into(),
                    heading: "Findings".into(),
                    text: "AI findings.\n".into(),
                    citations: vec![],
                    standards_tags: vec![],
                },
            ],
            compliance: vec![],
            markdown: String::new(),
        };
        let merged = merge_regenerated_sections(
            &existing,
            regenerated,
            &RegenerateScope {
                scope: "all".into(),
                section_id: None,
            },
        );
        let exec = merged
            .document
            .sections
            .iter()
            .find(|s| s.id == "executive")
            .unwrap();
        assert!(exec.text.contains("New executive"));
        let findings = merged
            .document
            .sections
            .iter()
            .find(|s| s.id == "findings")
            .unwrap();
        assert!(findings.text.contains("Edited findings"));
    }
}
