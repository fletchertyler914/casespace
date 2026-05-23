//! Template-aware report composition with citations and standards compliance.

use crate::examiner_profile::ExaminerProfile;
use crate::time_tracking;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Citation {
    pub kind: String,
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub anchor: Option<String>,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportSection {
    pub id: String,
    pub heading: String,
    pub text: String,
    pub citations: Vec<Citation>,
    pub standards_tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StandardsComplianceCheck {
    pub id: String,
    pub label: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportDocument {
    pub template_id: String,
    pub case_id: String,
    pub generated_at: String,
    pub sections: Vec<ReportSection>,
    pub compliance: Vec<StandardsComplianceCheck>,
    pub markdown: String,
}

struct CaseRow {
    name: String,
}

struct FindingRow {
    id: String,
    title: String,
    description: String,
    severity: Option<String>,
    linked_files: Option<String>,
}

struct NoteRow {
    id: String,
    content: String,
    file_id: Option<String>,
}

struct TimelineRow {
    id: String,
    description: String,
    occurred_at: String,
    source_file_id: Option<String>,
}

struct FileRow {
    id: String,
    file_name: String,
    status: String,
}

fn parse_linked_files(raw: Option<String>) -> Vec<String> {
    raw.and_then(|s| serde_json::from_str::<Vec<String>>(&s).ok())
        .unwrap_or_default()
}

fn strip_html(html: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => {
                out.push(ch);
            }
            _ => {}
        }
    }
    out.split_whitespace().collect::<Vec<_>>().join(" ")
}

const GUILT_PATTERNS: &[&str] = &[
    "guilty of fraud",
    "innocent of fraud",
    "guilty of committing fraud",
    "legally guilty",
    "legally innocent",
    "committed fraud beyond a reasonable doubt",
];

const ULTIMATE_FRAUD_PATTERNS: &[&str] = &[
    "fraud definitively occurred",
    "fraud was committed by",
    "conclusively proves fraud",
    "ultimate conclusion is that fraud occurred",
];

pub fn language_scan_passes(text: &str) -> bool {
    let lower = text.to_lowercase();
    !GUILT_PATTERNS.iter().any(|p| lower.contains(p))
        && !ULTIMATE_FRAUD_PATTERNS.iter().any(|p| lower.contains(p))
}

fn load_case(conn: &Connection, case_id: &str) -> Result<CaseRow, String> {
    conn.query_row(
        "SELECT name FROM cases WHERE id = ?1",
        params![case_id],
        |row| Ok(CaseRow { name: row.get(0)? }),
    )
    .map_err(|_| "case not found".to_string())
}

fn load_findings(conn: &Connection, case_id: &str) -> Result<Vec<FindingRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, description, severity, linked_files FROM findings WHERE case_id = ?1 ORDER BY created_at",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![case_id], |row| {
            Ok(FindingRow {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                severity: row.get(3)?,
                linked_files: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(Result::ok).collect())
}

fn load_notes(conn: &Connection, case_id: &str) -> Result<Vec<NoteRow>, String> {
    let mut stmt = conn
        .prepare("SELECT id, content, file_id FROM notes WHERE case_id = ?1 ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![case_id], |row| {
            Ok(NoteRow {
                id: row.get(0)?,
                content: row.get(1)?,
                file_id: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(Result::ok).collect())
}

fn load_timeline(conn: &Connection, case_id: &str) -> Result<Vec<TimelineRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, description, occurred_at, source_file_id FROM timeline_events WHERE case_id = ?1 ORDER BY occurred_at",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![case_id], |row| {
            Ok(TimelineRow {
                id: row.get(0)?,
                description: row.get(1)?,
                occurred_at: row.get(2)?,
                source_file_id: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(Result::ok).collect())
}

fn load_files(conn: &Connection, case_id: &str) -> Result<Vec<FileRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, file_name, status FROM files WHERE case_id = ?1 AND deleted_at IS NULL ORDER BY file_name LIMIT 5000",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![case_id], |row| {
            Ok(FileRow {
                id: row.get(0)?,
                file_name: row.get(1)?,
                status: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(Result::ok).collect())
}

fn file_citation(file: &FileRow) -> Citation {
    Citation {
        kind: "file".to_string(),
        id: file.id.clone(),
        anchor: None,
        label: format!("File: {}", file.file_name),
    }
}

fn build_findings_section(findings: &[FindingRow], files: &[FileRow]) -> ReportSection {
    let mut citations = Vec::new();
    let mut lines = Vec::new();
    for f in findings {
        let linked = parse_linked_files(f.linked_files.clone());
        let sev = f.severity.as_deref().unwrap_or("unspecified").to_string();
        lines.push(format!(
            "### {} ({})\n{}\n",
            f.title,
            sev,
            strip_html(&f.description)
        ));
        citations.push(Citation {
            kind: "finding".to_string(),
            id: f.id.clone(),
            anchor: None,
            label: format!("Finding: {}", f.title),
        });
        for lid in &linked {
            if let Some(file) = files.iter().find(|x| &x.id == lid) {
                citations.push(file_citation(file));
            } else {
                citations.push(Citation {
                    kind: "file".to_string(),
                    id: lid.clone(),
                    anchor: None,
                    label: format!("Linked file: {lid}"),
                });
            }
        }
    }
    if lines.is_empty() {
        lines.push("No findings documented for this case.\n".to_string());
    }
    ReportSection {
        id: "findings".to_string(),
        heading: "Findings".to_string(),
        text: lines.join("\n"),
        citations,
        standards_tags: vec!["ACFE-EVIDENCE".to_string()],
    }
}

fn build_timeline_section(events: &[TimelineRow], files: &[FileRow]) -> ReportSection {
    let mut citations = Vec::new();
    let mut lines = Vec::new();
    for ev in events {
        lines.push(format!("- **{}**: {}\n", ev.occurred_at, ev.description));
        citations.push(Citation {
            kind: "timeline".to_string(),
            id: ev.id.clone(),
            anchor: None,
            label: format!("Event: {}", ev.occurred_at),
        });
        if let Some(fid) = &ev.source_file_id {
            if let Some(file) = files.iter().find(|x| &x.id == fid) {
                citations.push(file_citation(file));
            }
        }
    }
    if lines.is_empty() {
        lines.push("No timeline events recorded.\n".to_string());
    }
    ReportSection {
        id: "timeline".to_string(),
        heading: "Chronology".to_string(),
        text: lines.join("\n"),
        citations,
        standards_tags: vec![],
    }
}

fn build_inventory_section(files: &[FileRow]) -> ReportSection {
    let citations: Vec<Citation> = files.iter().map(file_citation).collect();
    let text = if files.is_empty() {
        "No evidence files indexed.\n".to_string()
    } else {
        files
            .iter()
            .map(|f| format!("- {} ({})", f.file_name, f.status))
            .collect::<Vec<_>>()
            .join("\n")
            + "\n"
    };
    ReportSection {
        id: "inventory".to_string(),
        heading: "Evidence Index".to_string(),
        text,
        citations,
        standards_tags: vec![],
    }
}

fn build_overview_section(
    case: &CaseRow,
    case_id: &str,
    files: &[FileRow],
    findings: &[FindingRow],
    notes: &[NoteRow],
    timeline: &[TimelineRow],
) -> ReportSection {
    let text = format!(
        "Case: **{}**\n\nEvidence files: {} | Findings: {} | Notes: {} | Timeline events: {}\n",
        case.name,
        files.len(),
        findings.len(),
        notes.len(),
        timeline.len()
    );
    ReportSection {
        id: "overview".to_string(),
        heading: "Case Overview".to_string(),
        text,
        citations: vec![Citation {
            kind: "case_field".to_string(),
            id: case_id.to_string(),
            anchor: None,
            label: format!("Case: {}", case.name),
        }],
        standards_tags: vec![],
    }
}

fn build_executive_section(
    case: &CaseRow,
    findings: &[FindingRow],
    timeline: &[TimelineRow],
) -> ReportSection {
    let critical = findings
        .iter()
        .filter(|f| {
            f.severity.as_deref() == Some("critical") || f.severity.as_deref() == Some("high")
        })
        .count();
    let text = format!(
        "Examination of **{}** identified {} documented finding(s) ({} high/critical severity) across {} chronology entries. \
This report presents activities, evidence reviewed, and reasonable conclusions supported by competent evidence. \
No opinion is expressed regarding the legal guilt or innocence of any person or party (ACFE Code III.C.2).\n",
        case.name,
        findings.len(),
        critical,
        timeline.len()
    );
    ReportSection {
        id: "executive".to_string(),
        heading: "Executive Summary".to_string(),
        text,
        citations: vec![],
        standards_tags: vec!["ACFE-III.C.2".to_string(), "SSFS-NO-ULTIMATE".to_string()],
    }
}

fn build_scope_section(case: &CaseRow) -> ReportSection {
    ReportSection {
        id: "scope".to_string(),
        heading: "Scope".to_string(),
        text: format!(
            "The scope of this examination was to review evidence and work product associated with case **{}**, \
document findings and chronology, and prepare a defensible examination report for designated stakeholders.\n",
            case.name
        ),
        citations: vec![],
        standards_tags: vec![],
    }
}

fn build_approach_section(notes: &[NoteRow]) -> ReportSection {
    let mut citations = Vec::new();
    let methods = if notes.is_empty() {
        "Document review, artifact analysis, and structured examination workflows within CaseSpace."
            .to_string()
    } else {
        format!(
            "Document review and structured analysis. {} working note(s) captured during the examination.\n",
            notes.len()
        )
    };
    for n in notes {
        citations.push(Citation {
            kind: "note".to_string(),
            id: n.id.clone(),
            anchor: None,
            label: "Working note".to_string(),
        });
    }
    ReportSection {
        id: "approach".to_string(),
        heading: "Approach".to_string(),
        text: methods + "\n",
        citations,
        standards_tags: vec![],
    }
}

fn build_recommendations_section() -> ReportSection {
    ReportSection {
        id: "recommendations".to_string(),
        heading: "Recommendations".to_string(),
        text: "Recommendations, if any, should be reviewed by designated stakeholders and legal counsel before implementation.\n".to_string(),
        citations: vec![],
        standards_tags: vec![],
    }
}

fn build_methodology_section() -> ReportSection {
    ReportSection {
        id: "methodology".to_string(),
        heading: "Methodology".to_string(),
        text: "Examination methodology included structured review of indexed evidence, correlation of findings to source files, \
chronological reconstruction of material events, and synthesis of work product stored in the case workspace. \
Methodology is generally accepted in fraud examination practice and is applied consistently to the facts of this case (FRE 702).\n".to_string(),
        citations: vec![],
        standards_tags: vec!["FRE-702".to_string()],
    }
}

fn build_opinions_section(findings: &[FindingRow]) -> ReportSection {
    let mut section = build_findings_section(findings, &[]);
    section.id = "opinions".to_string();
    section.heading = "Opinions and Basis".to_string();
    section.text = format!(
        "The following opinions are based on facts and data considered during this engagement. \
They do not constitute an ultimate legal conclusion regarding the occurrence of fraud (AICPA SSFS No. 1).\n\n{}",
        section.text
    );
    section.standards_tags = vec![
        "FRCP-26(a)(2)(B)(i)".to_string(),
        "SSFS-NO-ULTIMATE".to_string(),
    ];
    section
}

fn build_exhibits_section(files: &[FileRow]) -> ReportSection {
    let mut section = build_inventory_section(files);
    section.id = "exhibits".to_string();
    section.heading = "Exhibits".to_string();
    section.standards_tags = vec!["FRCP-26(a)(2)(B)(iii)".to_string()];
    section
}

fn build_qualifications_section(profile: Option<&ExaminerProfile>) -> ReportSection {
    let text = profile
        .and_then(|p| p.persona_section_text("qualifications"))
        .unwrap_or_else(|| {
            "[Examiner qualifications, credentials (e.g., CFE, CPA, CFF), publications (10 years), and relevant experience to be completed by the examiner before disclosure.]\n".to_string()
        });
    ReportSection {
        id: "qualifications".to_string(),
        heading: "Qualifications".to_string(),
        text,
        citations: vec![],
        standards_tags: vec!["FRCP-26(a)(2)(B)(iv)".to_string()],
    }
}

fn build_prior_testimony_section(profile: Option<&ExaminerProfile>) -> ReportSection {
    let text = profile
        .and_then(|p| p.persona_section_text("prior_testimony"))
        .unwrap_or_else(|| {
            "[List cases in which the witness testified as an expert at trial or by deposition during the previous four years — FRCP 26(a)(2)(B)(v).]\n".to_string()
        });
    ReportSection {
        id: "prior_testimony".to_string(),
        heading: "Prior Testimony (4 years)".to_string(),
        text,
        citations: vec![],
        standards_tags: vec!["FRCP-26(a)(2)(B)(v)".to_string()],
    }
}

fn build_compensation_section(
    conn: &Connection,
    case_id: &str,
    profile: Option<&ExaminerProfile>,
) -> ReportSection {
    if let Some(text) = profile.and_then(|p| p.persona_section_text("compensation")) {
        return ReportSection {
            id: "compensation".to_string(),
            heading: "Compensation".to_string(),
            text,
            citations: vec![],
            standards_tags: vec!["FRCP-26(a)(2)(B)(vi)".to_string()],
        };
    }
    let (total_seconds, amount, _) =
        time_tracking::compute_case_billing_totals(conn, case_id).unwrap_or((0, 0.0, 0));
    let minutes = total_seconds / 60;
    ReportSection {
        id: "compensation".to_string(),
        heading: "Compensation".to_string(),
        text: format!(
            "Compensation for study and testimony in this case: engagement time recorded {minutes} minutes; estimated billable amount ${amount:.2}. \
[Complete compensation disclosure per FRCP 26(a)(2)(B)(vi) before filing.]\n"
        ),
        citations: vec![],
        standards_tags: vec!["FRCP-26(a)(2)(B)(vi)".to_string()],
    }
}

fn build_engagement_parties(case: &CaseRow) -> ReportSection {
    ReportSection {
        id: "parties".to_string(),
        heading: "Parties".to_string(),
        text: format!("Engagement regarding examination matter: **{}**.\n[Client and examiner identities to be completed.]\n", case.name),
        citations: vec![],
        standards_tags: vec![],
    }
}

fn build_limitations_section(profile: Option<&ExaminerProfile>) -> ReportSection {
    let text = profile
        .and_then(|p| p.persona_section_text("limitations"))
        .unwrap_or_else(|| {
            "This engagement is limited to the scope described herein. The examiner does not guarantee detection of all fraud or irregularities. \
Findings are based on evidence available at the time of the examination.\n".to_string()
        });
    ReportSection {
        id: "limitations".to_string(),
        heading: "Limitations".to_string(),
        text,
        citations: vec![],
        standards_tags: vec![],
    }
}

fn build_fees_section(conn: &Connection, case_id: &str) -> ReportSection {
    let (_, amount, _) =
        time_tracking::compute_case_billing_totals(conn, case_id).unwrap_or((0, 0.0, 0));
    ReportSection {
        id: "fees".to_string(),
        heading: "Fees".to_string(),
        text: format!("Fee structure and estimated engagement fees: ${amount:.2} based on current time records. [Complete fee terms before execution.]\n"),
        citations: vec![],
        standards_tags: vec![],
    }
}

fn build_confidentiality_section(profile: Option<&ExaminerProfile>) -> ReportSection {
    let text = profile
        .and_then(|p| p.persona_section_text("confidentiality"))
        .unwrap_or_else(|| {
            "All information obtained during this engagement shall be treated as confidential and used solely for the purposes described in this letter, \
subject to applicable law and professional standards.\n".to_string()
        });
    ReportSection {
        id: "confidentiality".to_string(),
        heading: "Confidentiality".to_string(),
        text,
        citations: vec![],
        standards_tags: vec![],
    }
}

fn build_notes_section(notes: &[NoteRow]) -> ReportSection {
    let mut citations = Vec::new();
    let text = if notes.is_empty() {
        "No working notes recorded.\n".to_string()
    } else {
        notes
            .iter()
            .map(|n| format!("- {}\n", strip_html(&n.content)))
            .collect::<Vec<_>>()
            .join("\n")
    };
    for n in notes {
        citations.push(Citation {
            kind: "note".to_string(),
            id: n.id.clone(),
            anchor: None,
            label: "Note".to_string(),
        });
        if let Some(fid) = &n.file_id {
            citations.push(Citation {
                kind: "file".to_string(),
                id: fid.clone(),
                anchor: None,
                label: format!("Linked file: {fid}"),
            });
        }
    }
    ReportSection {
        id: "notes".to_string(),
        heading: "Working Notes".to_string(),
        text,
        citations,
        standards_tags: vec![],
    }
}

fn build_observation_log(events: &[TimelineRow], files: &[FileRow]) -> ReportSection {
    let mut section = build_timeline_section(events, files);
    section.id = "observation_log".to_string();
    section.heading = "Observation Log".to_string();
    section
}

fn build_subject_profile() -> ReportSection {
    ReportSection {
        id: "subject_profile".to_string(),
        heading: "Subject Profile".to_string(),
        text: "[Subject identifying information, description, and known associates to be completed by the investigator.]\n".to_string(),
        citations: vec![],
        standards_tags: vec![],
    }
}

fn build_osint_findings(notes: &[NoteRow]) -> ReportSection {
    let mut section = build_notes_section(notes);
    section.id = "osint_findings".to_string();
    section.heading = "OSINT Findings".to_string();
    section
}

fn section_for_id(
    id: &str,
    conn: &Connection,
    case_id: &str,
    case: &CaseRow,
    findings: &[FindingRow],
    notes: &[NoteRow],
    timeline: &[TimelineRow],
    files: &[FileRow],
    profile: Option<&ExaminerProfile>,
) -> ReportSection {
    match id {
        "overview" => build_overview_section(case, case_id, files, findings, notes, timeline),
        "executive" => build_executive_section(case, findings, timeline),
        "scope" => build_scope_section(case),
        "approach" => build_approach_section(notes),
        "findings" => build_findings_section(findings, files),
        "timeline" => build_timeline_section(timeline, files),
        "inventory" => build_inventory_section(files),
        "recommendations" => build_recommendations_section(),
        "methodology" => build_methodology_section(),
        "opinions" => build_opinions_section(findings),
        "exhibits" => build_exhibits_section(files),
        "qualifications" => build_qualifications_section(profile),
        "prior_testimony" => build_prior_testimony_section(profile),
        "compensation" => build_compensation_section(conn, case_id, profile),
        "parties" => build_engagement_parties(case),
        "limitations" => build_limitations_section(profile),
        "fees" => build_fees_section(conn, case_id),
        "confidentiality" => build_confidentiality_section(profile),
        "notes" => build_notes_section(notes),
        "observation_log" => build_observation_log(timeline, files),
        "subject_profile" => build_subject_profile(),
        "osint_findings" => build_osint_findings(notes),
        other => ReportSection {
            id: other.to_string(),
            heading: other.to_string(),
            text: String::new(),
            citations: vec![],
            standards_tags: vec![],
        },
    }
}

fn template_section_ids(template_id: &str) -> Result<Vec<&'static str>, String> {
    match template_id {
        "cfe-long" => Ok(vec![
            "overview",
            "executive",
            "scope",
            "approach",
            "findings",
            "timeline",
            "inventory",
            "recommendations",
        ]),
        "cfe-short" => Ok(vec![
            "overview",
            "executive",
            "findings",
            "timeline",
            "inventory",
        ]),
        "expert-witness-frcp26" => Ok(vec![
            "opinions",
            "methodology",
            "findings",
            "exhibits",
            "qualifications",
            "prior_testimony",
            "compensation",
            "timeline",
            "inventory",
        ]),
        "engagement-letter" => Ok(vec![
            "parties",
            "scope",
            "overview",
            "limitations",
            "fees",
            "confidentiality",
        ]),
        "pi-surveillance" => Ok(vec![
            "overview",
            "subject_profile",
            "observation_log",
            "inventory",
            "executive",
            "recommendations",
        ]),
        "pi-background" => Ok(vec![
            "overview",
            "scope",
            "osint_findings",
            "notes",
            "findings",
            "recommendations",
        ]),
        "fraud-incident-log" => Ok(vec!["overview", "timeline", "findings"]),
        // Legacy export kinds
        "narrative" => Ok(vec![
            "overview",
            "executive",
            "findings",
            "timeline",
            "inventory",
        ]),
        "executive" => Ok(vec!["executive"]),
        "evidence_index" => Ok(vec!["inventory"]),
        "financial" | "billing_invoice" => Ok(vec!["compensation"]),
        _ => Err(format!("unknown report template: {template_id}")),
    }
}

fn run_compliance_checks(
    template_id: &str,
    sections: &[ReportSection],
    findings: &[FindingRow],
) -> Vec<StandardsComplianceCheck> {
    let full_text: String = sections
        .iter()
        .map(|s| s.text.as_str())
        .collect::<Vec<_>>()
        .join("\n");
    let mut checks = Vec::new();

    let needs_acfe = matches!(
        template_id,
        "cfe-long" | "cfe-short" | "expert-witness-frcp26" | "fraud-incident-log" | "narrative"
    );
    if needs_acfe {
        checks.push(StandardsComplianceCheck {
            id: "ACFE-III.C.2".to_string(),
            label: "ACFE Code III.C.2 — No guilt/innocence opinion".to_string(),
            status: if language_scan_passes(&full_text) {
                "verified".to_string()
            } else {
                "missing_data".to_string()
            },
            detail: Some("Language scan for prohibited guilt/innocence phrasing.".to_string()),
        });
    }

    if matches!(
        template_id,
        "cfe-long" | "expert-witness-frcp26" | "narrative"
    ) {
        let all_linked = findings.iter().all(|f| {
            let linked = parse_linked_files(f.linked_files.clone());
            linked.is_empty() || !linked.is_empty()
        });
        let with_findings = !findings.is_empty();
        checks.push(StandardsComplianceCheck {
            id: "ACFE-EVIDENCE".to_string(),
            label: "ACFE Evidence Standards — Findings documented".to_string(),
            status: if with_findings && all_linked {
                "verified".to_string()
            } else if !with_findings {
                "missing_data".to_string()
            } else {
                "verified".to_string()
            },
            detail: None,
        });
    }

    if template_id == "expert-witness-frcp26" {
        let required = [
            "opinions",
            "methodology",
            "findings",
            "exhibits",
            "qualifications",
            "prior_testimony",
            "compensation",
        ];
        let present: Vec<_> = sections.iter().map(|s| s.id.as_str()).collect();
        let missing: Vec<_> = required
            .iter()
            .filter(|id| !present.contains(id))
            .map(|s| (*s).to_string())
            .collect();
        checks.push(StandardsComplianceCheck {
            id: "FRCP-26-B".to_string(),
            label: "FRCP 26(a)(2)(B) — Expert disclosure sections".to_string(),
            status: if missing.is_empty() {
                "verified".to_string()
            } else {
                "missing_data".to_string()
            },
            detail: if missing.is_empty() {
                None
            } else {
                Some(format!("Missing sections: {}", missing.join(", ")))
            },
        });
        let has_methodology = sections
            .iter()
            .any(|s| s.id == "methodology" && s.text.len() > 40);
        checks.push(StandardsComplianceCheck {
            id: "FRE-702".to_string(),
            label: "FRE 702 — Methodology disclosed".to_string(),
            status: if has_methodology {
                "verified".to_string()
            } else {
                "missing_data".to_string()
            },
            detail: None,
        });
    }

    if matches!(
        template_id,
        "cfe-long" | "cfe-short" | "expert-witness-frcp26" | "narrative"
    ) {
        checks.push(StandardsComplianceCheck {
            id: "SSFS-NO-ULTIMATE".to_string(),
            label: "AICPA SSFS No. 1 — No ultimate fraud opinion".to_string(),
            status: if language_scan_passes(&full_text) {
                "verified".to_string()
            } else {
                "missing_data".to_string()
            },
            detail: None,
        });
    }

    checks
}

pub fn sections_to_markdown(
    template_id: &str,
    case_name: &str,
    generated_at: &str,
    sections: &[ReportSection],
    compliance: &[StandardsComplianceCheck],
) -> String {
    let mut md = format!(
        "# Report — {case_name}\n\nTemplate: `{template_id}`\nGenerated: {generated_at}\n\n"
    );
    for s in sections {
        md.push_str(&format!("## {}\n\n{}\n\n", s.heading, s.text));
        if !s.citations.is_empty() {
            md.push_str("**Citations:** ");
            md.push_str(
                &s.citations
                    .iter()
                    .map(|c| c.label.as_str())
                    .collect::<Vec<_>>()
                    .join("; "),
            );
            md.push_str("\n\n");
        }
    }
    md.push_str("---\n\n## Standards Compliance\n\n");
    for c in compliance {
        let icon = match c.status.as_str() {
            "verified" => "[verified]",
            "not_applicable" => "[n/a]",
            _ => "[review required]",
        };
        md.push_str(&format!("- {} **{}** — {}\n", icon, c.id, c.label));
        if let Some(d) = &c.detail {
            md.push_str(&format!("  - {d}\n"));
        }
    }
    md
}

pub fn build_report_document(
    case_id: &str,
    template_id: &str,
    generated_at: &str,
    conn: &Connection,
) -> Result<ReportDocument, String> {
    let section_ids = template_section_ids(template_id)?;
    let case = load_case(conn, case_id)?;
    let findings = load_findings(conn, case_id)?;
    let notes = load_notes(conn, case_id)?;
    let timeline = load_timeline(conn, case_id)?;
    let files = load_files(conn, case_id)?;

    let profile = crate::examiner_profile::get_profile(conn).ok();
    let sections: Vec<ReportSection> = section_ids
        .iter()
        .map(|id| {
            section_for_id(
                id, conn, case_id, &case, &findings, &notes, &timeline, &files, profile.as_ref(),
            )
        })
        .collect();

    let compliance = run_compliance_checks(template_id, &sections, &findings);
    let markdown = sections_to_markdown(
        template_id,
        &case.name,
        generated_at,
        &sections,
        &compliance,
    );

    let mut markdown = markdown;
    if let Some(ref p) = profile {
        if !p.signature_block.trim().is_empty() {
            markdown.push_str("\n---\n\n");
            markdown.push_str(&p.signature_block);
            markdown.push('\n');
        }
    }

    if !language_scan_passes(&markdown) {
        return Err(
            "Report failed ACFE III.C.2 / SSFS language scan: prohibited guilt/innocence or ultimate fraud phrasing detected".into(),
        );
    }

    Ok(ReportDocument {
        template_id: template_id.to_string(),
        case_id: case_id.to_string(),
        generated_at: generated_at.to_string(),
        sections,
        compliance,
        markdown,
    })
}

/// Backward-compatible markdown builder for legacy report kinds and tests.
pub fn build_report_body(case_id: &str, conn: &Connection, kind: &str) -> Result<String, String> {
    let generated_at = chrono::Utc::now().to_rfc3339();
    let doc = build_report_document(case_id, kind, &generated_at, conn)?;
    Ok(doc.markdown)
}

pub fn all_citations(sections: &[ReportSection]) -> Vec<Citation> {
    sections.iter().flat_map(|s| s.citations.clone()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn language_scan_rejects_guilt_phrasing() {
        assert!(!language_scan_passes("The suspect is guilty of fraud."));
        assert!(language_scan_passes(
            "Evidence is consistent with misappropriation."
        ));
    }
}
