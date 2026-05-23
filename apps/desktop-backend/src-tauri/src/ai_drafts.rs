//! AI draft persistence and approval → durable artifacts.

use crate::reports;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFindingDraft {
    pub id: String,
    pub case_id: String,
    pub title: String,
    pub description: String,
    pub severity: String,
    pub linked_file_ids: Option<Vec<String>>,
    pub page_anchors: Option<Vec<String>>,
    pub model: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiTimelineDraft {
    pub id: String,
    pub case_id: String,
    pub description: String,
    pub occurred_at: String,
    pub source_file_id: Option<String>,
    pub page_anchor: Option<String>,
    pub model: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiEntityDraft {
    pub id: String,
    pub case_id: String,
    pub kind: String,
    pub value: String,
    pub source_file_id: Option<String>,
    pub page_anchor: Option<String>,
    pub count: i32,
    pub model: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiDraftsBundle {
    pub finding_drafts: Vec<AiFindingDraft>,
    pub timeline_drafts: Vec<AiTimelineDraft>,
    pub entity_drafts: Vec<AiEntityDraft>,
}

fn parse_json_vec(raw: Option<String>) -> Option<Vec<String>> {
    raw.and_then(|s| serde_json::from_str(&s).ok())
}

pub fn list_ai_drafts(conn: &Connection, case_id: &str) -> Result<AiDraftsBundle, String> {
    let mut finding_stmt = conn
        .prepare(
            "SELECT id, case_id, title, description, severity, linked_file_ids, page_anchors, model, status, created_at
             FROM ai_finding_drafts WHERE case_id = ?1 AND status = 'pending' ORDER BY created_at",
        )
        .map_err(|e| e.to_string())?;
    let finding_drafts: Vec<AiFindingDraft> = finding_stmt
        .query_map(params![case_id], |row| {
            Ok(AiFindingDraft {
                id: row.get(0)?,
                case_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                severity: row.get(4)?,
                linked_file_ids: parse_json_vec(row.get(5)?),
                page_anchors: parse_json_vec(row.get(6)?),
                model: row.get(7)?,
                status: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let mut timeline_stmt = conn
        .prepare(
            "SELECT id, case_id, description, occurred_at, source_file_id, page_anchor, model, status, created_at
             FROM ai_timeline_drafts WHERE case_id = ?1 AND status = 'pending' ORDER BY occurred_at",
        )
        .map_err(|e| e.to_string())?;
    let timeline_drafts: Vec<AiTimelineDraft> = timeline_stmt
        .query_map(params![case_id], |row| {
            Ok(AiTimelineDraft {
                id: row.get(0)?,
                case_id: row.get(1)?,
                description: row.get(2)?,
                occurred_at: row.get(3)?,
                source_file_id: row.get(4)?,
                page_anchor: row.get(5)?,
                model: row.get(6)?,
                status: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let mut entity_stmt = conn
        .prepare(
            "SELECT id, case_id, kind, value, source_file_id, page_anchor, count, model, status, created_at
             FROM ai_entity_drafts WHERE case_id = ?1 AND status = 'pending' ORDER BY created_at",
        )
        .map_err(|e| e.to_string())?;
    let entity_drafts: Vec<AiEntityDraft> = entity_stmt
        .query_map(params![case_id], |row| {
            Ok(AiEntityDraft {
                id: row.get(0)?,
                case_id: row.get(1)?,
                kind: row.get(2)?,
                value: row.get(3)?,
                source_file_id: row.get(4)?,
                page_anchor: row.get(5)?,
                count: row.get(6)?,
                model: row.get(7)?,
                status: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(AiDraftsBundle {
        finding_drafts,
        timeline_drafts,
        entity_drafts,
    })
}

pub fn count_approved_finding_drafts(conn: &Connection, case_id: &str) -> Result<i64, String> {
    conn.query_row(
        "SELECT COUNT(*) FROM ai_finding_drafts WHERE case_id = ?1 AND status = 'approved'",
        params![case_id],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())
}

pub fn insert_finding_draft(
    conn: &Connection,
    case_id: &str,
    title: &str,
    description: &str,
    severity: &str,
    linked_file_ids: &[String],
    page_anchors: &[String],
    model: &str,
) -> Result<String, String> {
    if !reports::language_scan_passes(description) {
        return Err("finding draft failed language scan".into());
    }
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let linked_json = serde_json::to_string(linked_file_ids).map_err(|e| e.to_string())?;
    let anchors_json = serde_json::to_string(page_anchors).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO ai_finding_drafts (id, case_id, title, description, severity, linked_file_ids, page_anchors, model, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'pending', ?9)",
        params![
            id,
            case_id,
            title,
            description,
            severity,
            linked_json,
            anchors_json,
            model,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

pub fn insert_timeline_draft(
    conn: &Connection,
    case_id: &str,
    description: &str,
    occurred_at: &str,
    source_file_id: Option<&str>,
    page_anchor: Option<&str>,
    model: &str,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO ai_timeline_drafts (id, case_id, description, occurred_at, source_file_id, page_anchor, model, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', ?8)",
        params![id, case_id, description, occurred_at, source_file_id, page_anchor, model, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

pub fn insert_entity_draft(
    conn: &Connection,
    case_id: &str,
    kind: &str,
    value: &str,
    source_file_id: Option<&str>,
    page_anchor: Option<&str>,
    model: &str,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO ai_entity_drafts (id, case_id, kind, value, source_file_id, page_anchor, count, model, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, 'pending', ?8)",
        params![id, case_id, kind, value, source_file_id, page_anchor, model, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

pub fn approve_finding_draft(conn: &Connection, draft_id: &str) -> Result<String, String> {
    let row: (String, String, String, String, Option<String>) = conn
        .query_row(
            "SELECT case_id, title, description, severity, linked_file_ids FROM ai_finding_drafts WHERE id = ?1 AND status = 'pending'",
            params![draft_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
        )
        .map_err(|_| "draft not found or already decided".to_string())?;

    let finding_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO findings (id, case_id, title, description, severity, linked_files, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
        params![
            finding_id,
            row.0,
            row.1,
            row.2,
            row.3,
            row.4,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE ai_finding_drafts SET status = 'approved', decided_at = ?1, decided_by_finding_id = ?2 WHERE id = ?3",
        params![now, finding_id, draft_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(finding_id)
}

pub fn reject_finding_draft(conn: &Connection, draft_id: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let n = conn
        .execute(
            "UPDATE ai_finding_drafts SET status = 'rejected', decided_at = ?1 WHERE id = ?2 AND status = 'pending'",
            params![now, draft_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("draft not found or already decided".into());
    }
    Ok(())
}

pub fn approve_timeline_draft(conn: &Connection, draft_id: &str) -> Result<String, String> {
    let row: (String, String, String, Option<String>) = conn
        .query_row(
            "SELECT case_id, description, occurred_at, source_file_id FROM ai_timeline_drafts WHERE id = ?1 AND status = 'pending'",
            params![draft_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .map_err(|_| "draft not found or already decided".to_string())?;

    let event_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO timeline_events (id, case_id, description, occurred_at, source_file_id, event_type, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'ai_draft', ?6)",
        params![event_id, row.0, row.1, row.2, row.3, now],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE ai_timeline_drafts SET status = 'approved', decided_at = ?1, decided_by_event_id = ?2 WHERE id = ?3",
        params![now, event_id, draft_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(event_id)
}

pub fn reject_timeline_draft(conn: &Connection, draft_id: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let n = conn
        .execute(
            "UPDATE ai_timeline_drafts SET status = 'rejected', decided_at = ?1 WHERE id = ?2 AND status = 'pending'",
            params![now, draft_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("draft not found or already decided".into());
    }
    Ok(())
}

pub fn approve_entity_draft(conn: &Connection, draft_id: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let n = conn
        .execute(
            "UPDATE ai_entity_drafts SET status = 'approved', decided_at = ?1 WHERE id = ?2 AND status = 'pending'",
            params![now, draft_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("draft not found or already decided".into());
    }
    Ok(())
}

pub fn reject_entity_draft(conn: &Connection, draft_id: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let n = conn
        .execute(
            "UPDATE ai_entity_drafts SET status = 'rejected', decided_at = ?1 WHERE id = ?2 AND status = 'pending'",
            params![now, draft_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("draft not found or already decided".into());
    }
    Ok(())
}

pub fn mark_drafts_merged(conn: &Connection, draft_ids: &[String]) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    for id in draft_ids {
        let _ = conn.execute(
            "UPDATE ai_finding_drafts SET status = 'merged', decided_at = ?1 WHERE id = ?2",
            params![now, id],
        );
    }
    Ok(())
}
