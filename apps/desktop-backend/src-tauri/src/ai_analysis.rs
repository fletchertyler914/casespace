//! Per-file and corpus AI analysis → draft rows.

use crate::ai_drafts::{
    insert_entity_draft, insert_finding_draft, insert_timeline_draft, mark_drafts_merged,
};
use crate::ai_provider::{
    analysis_max_chars, analysis_token_ceiling, finish_run_log, start_run_log,
};
use crate::ai_reports::redact_for_llm;
use crate::reports;
use crate::text_extract;
use rusqlite::{params, Connection};
use serde::Deserialize;
use std::collections::{HashMap, HashSet};

#[derive(Debug, Deserialize)]
struct FileAnalysisResponse {
    findings: Vec<FileFindingItem>,
    timeline: Vec<FileTimelineItem>,
    entities: Vec<FileEntityItem>,
}

#[derive(Debug, Deserialize)]
struct FileFindingItem {
    title: String,
    description: String,
    severity: Option<String>,
    page_anchor: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FileTimelineItem {
    description: String,
    occurred_at: Option<String>,
    page_anchor: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FileEntityItem {
    kind: String,
    value: String,
    page_anchor: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CorpusMergeGroup {
    draft_ids: Vec<String>,
    consolidated_title: String,
    consolidated_description: String,
    severity: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CorpusAnalysisResponse {
    merge_groups: Vec<CorpusMergeGroup>,
}

pub struct FileAnalysisPrepared {
    pub case_id: String,
    pub file_id: String,
    pub model: String,
    pub run_id: String,
    pub prompt: String,
}

pub struct CorpusAnalysisPrepared {
    pub case_id: String,
    pub model: String,
    pub run_id: String,
    pub prompt: String,
    pub valid_ids: Vec<String>,
    pub draft_file_ids: HashMap<String, Vec<String>>,
}

fn cap_text(text: &str) -> String {
    let max = analysis_max_chars();
    if text.len() <= max {
        text.to_string()
    } else {
        text.chars().take(max).collect()
    }
}

fn estimate_tokens(text: &str) -> usize {
    text.len() / 4 + 1
}

fn file_row(conn: &Connection, case_id: &str, file_id: &str) -> Result<(String, String), String> {
    conn.query_row(
        "SELECT file_name, absolute_path FROM files WHERE id = ?1 AND case_id = ?2 AND deleted_at IS NULL",
        params![file_id, case_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )
    .map_err(|_| "file not found".to_string())
}

pub fn extract_and_store_file(
    conn: &Connection,
    case_id: &str,
    file_id: &str,
    force: bool,
    extracted_at: &str,
) -> Result<text_extract::FileTextExtractResult, String> {
    if !force {
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM file_text_extracts WHERE file_id = ?1 AND char_count > 0",
                params![file_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if exists > 0 {
            return conn
                .query_row(
                    "SELECT file_id, char_count, extractor, ocr_used, extracted_at, extract_error FROM file_text_extracts WHERE file_id = ?1",
                    params![file_id],
                    |row| {
                        Ok(text_extract::FileTextExtractResult {
                            file_id: row.get(0)?,
                            char_count: row.get::<_, i64>(1)? as usize,
                            extractor: row.get(2)?,
                            ocr_used: row.get::<_, i64>(3)? != 0,
                            extracted_at: row.get(4)?,
                            extract_error: row.get(5)?,
                        })
                    },
                )
                .map_err(|e| e.to_string());
        }
    }

    let (_, path_str) = file_row(conn, case_id, file_id)?;
    let path = std::path::Path::new(&path_str);
    let (text, extractor, ocr_used, err) = text_extract::extract_text_from_path(path);
    text_extract::persist_extract(
        conn,
        file_id,
        &text,
        None,
        &extractor,
        ocr_used,
        err.as_deref(),
        extracted_at,
    )
}

pub fn prepare_file_analysis(
    conn: &Connection,
    case_id: &str,
    file_id: &str,
    model: &str,
) -> Result<FileAnalysisPrepared, String> {
    let (file_name, _) = file_row(conn, case_id, file_id)?;
    let text = text_extract::load_extract_text(conn, file_id)?
        .filter(|t| !t.trim().is_empty())
        .ok_or_else(|| "no extracted text for file; run extract first".to_string())?;

    let capped = cap_text(&text);
    if estimate_tokens(&capped) > analysis_token_ceiling() {
        return Err("estimated tokens exceed CASESPACE_ANALYSIS_TOKEN_CEILING".into());
    }

    let redacted = redact_for_llm(&format!("File: {file_name}\n\n{capped}"));
    let run_id = start_run_log(conn, case_id, "analyze_file_with_ai", model, redacted.len())?;

    let prompt = format!(
        r#"Analyze this evidence file for a fraud examination case. Return JSON only:
{{"findings":[{{"title":"...","description":"...","severity":"low|medium|high|critical","page_anchor":"p.1"}}],
"timeline":[{{"description":"...","occurred_at":"ISO8601 or null","page_anchor":"p.2"}}],
"entities":[{{"kind":"person|org|amount|account","value":"...","page_anchor":"p.1"}}]}}

Rules:
- Only facts supported by the supplied text.
- No guilt/innocence or ultimate fraud conclusions.
- Every item needs page_anchor when possible.
- If nothing substantive, return empty arrays.

Evidence:
{redacted}"#
    );

    Ok(FileAnalysisPrepared {
        case_id: case_id.to_string(),
        file_id: file_id.to_string(),
        model: model.to_string(),
        run_id,
        prompt,
    })
}

pub fn persist_file_analysis(
    conn: &Connection,
    prepared: &FileAnalysisPrepared,
    raw: &str,
) -> Result<usize, String> {
    let parsed: FileAnalysisResponse =
        serde_json::from_str(raw).map_err(|e| format!("invalid analysis JSON: {e}"))?;

    let mut count = 0usize;
    for f in parsed.findings {
        if f.title.trim().is_empty() || f.description.trim().is_empty() {
            continue;
        }
        let sev = f.severity.unwrap_or_else(|| "medium".to_string());
        let anchor = f.page_anchor.unwrap_or_default();
        insert_finding_draft(
            conn,
            &prepared.case_id,
            &f.title,
            &f.description,
            &sev,
            &[prepared.file_id.clone()],
            &[anchor],
            &prepared.model,
        )?;
        count += 1;
    }
    for t in parsed.timeline {
        if t.description.trim().is_empty() {
            continue;
        }
        let occurred = t
            .occurred_at
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
        insert_timeline_draft(
            conn,
            &prepared.case_id,
            &t.description,
            &occurred,
            Some(&prepared.file_id),
            t.page_anchor.as_deref(),
            &prepared.model,
        )?;
        count += 1;
    }
    for e in parsed.entities {
        if e.value.trim().is_empty() {
            continue;
        }
        insert_entity_draft(
            conn,
            &prepared.case_id,
            &e.kind,
            &e.value,
            Some(&prepared.file_id),
            e.page_anchor.as_deref(),
            &prepared.model,
        )?;
        count += 1;
    }
    let _ = finish_run_log(conn, &prepared.run_id, raw.len(), "completed", None);
    Ok(count)
}

pub fn fail_file_analysis(conn: &Connection, prepared: &FileAnalysisPrepared, error: &str) {
    let _ = finish_run_log(conn, &prepared.run_id, 0, "failed", Some(error));
}

pub fn prepare_corpus_analysis(
    conn: &Connection,
    case_id: &str,
    model: &str,
) -> Result<Option<CorpusAnalysisPrepared>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, description, severity, linked_file_ids FROM ai_finding_drafts WHERE case_id = ?1 AND status = 'pending'",
        )
        .map_err(|e| e.to_string())?;
    let rows: Vec<(String, String, String, String, Option<String>)> = stmt
        .query_map(params![case_id], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    if rows.len() < 2 {
        return Ok(None);
    }

    let mut payload = String::new();
    let mut valid_ids = Vec::new();
    let mut draft_file_ids = HashMap::new();
    for (id, title, desc, sev, linked) in &rows {
        valid_ids.push(id.clone());
        payload.push_str(&format!(
            "- id={id} title={title} severity={sev} desc={desc}\n"
        ));
        if let Some(raw) = linked {
            if let Ok(ids) = serde_json::from_str::<Vec<String>>(raw) {
                draft_file_ids.insert(id.clone(), ids);
            }
        }
    }
    let redacted = redact_for_llm(&payload);
    let run_id = start_run_log(conn, case_id, "analyze_case_with_ai", model, redacted.len())?;

    let prompt = format!(
        r#"Given pending finding drafts, identify groups to merge into consolidated findings.
Return JSON: {{"merge_groups":[{{"draft_ids":["id1","id2"],"consolidated_title":"...","consolidated_description":"...","severity":"medium"}}]}}
Only merge clearly duplicate/overlapping findings. No guilt/innocence language.

Drafts:
{redacted}"#
    );

    Ok(Some(CorpusAnalysisPrepared {
        case_id: case_id.to_string(),
        model: model.to_string(),
        run_id,
        prompt,
        valid_ids,
        draft_file_ids,
    }))
}

pub fn persist_corpus_analysis(
    conn: &Connection,
    prepared: &CorpusAnalysisPrepared,
    raw: &str,
) -> Result<usize, String> {
    let parsed: CorpusAnalysisResponse =
        serde_json::from_str(raw).map_err(|e| format!("invalid corpus JSON: {e}"))?;

    let valid_ids: HashSet<String> = prepared.valid_ids.iter().cloned().collect();
    let mut merged = 0usize;

    for group in parsed.merge_groups {
        if group.draft_ids.len() < 2 {
            continue;
        }
        if !group.draft_ids.iter().all(|id| valid_ids.contains(id)) {
            continue;
        }
        if !reports::language_scan_passes(&group.consolidated_description) {
            continue;
        }
        let sev = group.severity.unwrap_or_else(|| "medium".to_string());
        let mut file_ids = Vec::new();
        for id in &group.draft_ids {
            if let Some(ids) = prepared.draft_file_ids.get(id) {
                for fid in ids {
                    if !file_ids.contains(fid) {
                        file_ids.push(fid.clone());
                    }
                }
            }
        }

        insert_finding_draft(
            conn,
            &prepared.case_id,
            &group.consolidated_title,
            &group.consolidated_description,
            &sev,
            &file_ids,
            &[],
            &prepared.model,
        )?;
        mark_drafts_merged(conn, &group.draft_ids)?;
        merged += 1;
    }
    let _ = finish_run_log(conn, &prepared.run_id, raw.len(), "completed", None);
    Ok(merged)
}

pub fn fail_corpus_analysis(conn: &Connection, prepared: &CorpusAnalysisPrepared, error: &str) {
    let _ = finish_run_log(conn, &prepared.run_id, 0, "failed", Some(error));
}
