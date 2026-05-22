pub mod database;
pub mod field_extraction;
pub mod ingest;
pub mod path;
mod search;
mod time_tracking;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::Utc;
use database::{db_path, legacy_json_path, Database};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;
use walkdir::WalkDir;

pub(crate) fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn unix_now() -> i64 {
    Utc::now().timestamp()
}

pub(crate) struct AppState {
    db: Database,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CaseSummary {
    id: String,
    name: String,
    status: String,
    source_paths: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CaseFile {
    id: String,
    case_id: String,
    file_name: String,
    file_path: String,
    folder_path: Option<String>,
    file_hash: Option<String>,
    size_bytes: u64,
    modified_at: String,
    status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Note {
    id: String,
    case_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    file_id: Option<String>,
    content: String,
    pinned: bool,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FileNoteCount {
    file_id: String,
    count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CaseFileMetadata {
    file_id: String,
    metadata_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Finding {
    id: String,
    case_id: String,
    title: String,
    description: String,
    severity: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    linked_files: Option<Vec<String>>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TimelineEvent {
    id: String,
    case_id: String,
    description: String,
    occurred_at: String,
    event_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    source_file_id: Option<String>,
    created_at: String,
}

fn parse_linked_files_json(raw: Option<String>) -> Option<Vec<String>> {
    let s = raw?;
    let parsed: Vec<String> = serde_json::from_str(&s).ok()?;
    if parsed.is_empty() {
        None
    } else {
        Some(parsed)
    }
}

fn linked_files_to_json(files: Option<Vec<String>>) -> Option<String> {
    let files = files?;
    if files.is_empty() {
        return None;
    }
    serde_json::to_string(&files).ok()
}

fn note_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Note> {
    Ok(Note {
        id: row.get(0)?,
        case_id: row.get(1)?,
        file_id: row.get(2)?,
        content: row.get(3)?,
        pinned: row.get::<_, i64>(4)? != 0,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchHit {
    pub id: String,
    pub entity_type: String,
    pub title: String,
    pub snippet: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateCheckResult {
    version: String,
    current_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReportExport {
    report_type: String,
    file_path: String,
    generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReportExportHistoryEntry {
    id: String,
    case_id: String,
    report_type: String,
    file_path: String,
    generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DuplicateGroup {
    group_id: String,
    file_ids: Vec<String>,
    primary_file_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FileChangeCheck {
    file_id: String,
    changed: bool,
}

pub(crate) fn with_conn<F, T>(state: &State<AppState>, f: F) -> Result<T, String>
where
    F: FnOnce(&rusqlite::Connection) -> Result<T, String>,
{
    let db = state.db.conn.lock().map_err(|_| "db lock poisoned")?;
    f(&db)
}

fn with_conn_mut<F, T>(state: &State<AppState>, f: F) -> Result<T, String>
where
    F: FnOnce(&mut rusqlite::Connection) -> Result<T, String>,
{
    let mut db = state.db.conn.lock().map_err(|_| "db lock poisoned")?;
    f(&mut db)
}

fn list_sources_for_case(conn: &rusqlite::Connection, case_id: &str) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare("SELECT source_path FROM case_sources WHERE case_id = ?1 ORDER BY added_at")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![case_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(Result::ok).collect())
}

pub(crate) fn case_exists(conn: &rusqlite::Connection, case_id: &str) -> Result<bool, String> {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM cases WHERE id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(count > 0)
}

fn hash_file(path: &Path) -> Option<String> {
    let data = fs::read(path).ok()?;
    let digest = Sha256::digest(data);
    Some(format!("{:x}", digest))
}

/// Parent directory of `file`, relative to the ingested case `root` (empty → None).
fn relative_folder_path(file: &Path, root: &Path) -> Option<String> {
    let parent = file.parent()?;
    let rel = parent.strip_prefix(root).ok()?;
    if rel.as_os_str().is_empty() {
        return None;
    }
    Some(rel.to_string_lossy().replace('\\', "/"))
}

fn folder_path_for_file_under_roots(file: &Path, roots: &[String]) -> Option<String> {
    for root_str in roots {
        let root = Path::new(root_str);
        if let Some(rel) = relative_folder_path(file, root) {
            return Some(rel);
        }
    }
    file.parent().map(|p| p.to_string_lossy().replace('\\', "/"))
}

fn scan_files_under(
    root: &Path,
    case_id: &str,
    limit: usize,
) -> Vec<(
    String,
    String,
    String,
    String,
    Option<String>,
    u64,
    String,
    String,
)> {
    let mut out = Vec::new();
    for entry in WalkDir::new(root).into_iter().filter_map(Result::ok).take(limit) {
        let Ok(metadata) = entry.metadata() else {
            continue;
        };
        if !metadata.is_file() {
            continue;
        }
        let abs = entry.path().to_string_lossy().to_string();
        let file_name = entry.file_name().to_string_lossy().to_string();
        let folder = relative_folder_path(entry.path(), root);
        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| {
                chrono::DateTime::from_timestamp(d.as_secs() as i64, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_else(now_iso)
            })
            .unwrap_or_else(now_iso);
        let file_hash = hash_file(entry.path());
        out.push((
            Uuid::new_v4().to_string(),
            case_id.to_string(),
            file_name,
            abs,
            folder,
            metadata.len(),
            file_hash.unwrap_or_default(),
            modified,
        ));
    }
    out
}

#[tauri::command]
fn create_case(
    name: String,
    source_paths: Vec<String>,
    state: State<AppState>,
) -> Result<CaseSummary, String> {
    if name.trim().is_empty() {
        return Err("case name cannot be empty".into());
    }
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    with_conn(&state, |conn| {
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, ?2, 'active', ?3, ?3)",
            params![id, name.trim(), now],
        )
        .map_err(|e| e.to_string())?;
        for path in &source_paths {
            if path.trim().is_empty() {
                continue;
            }
            let sid = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO case_sources (id, case_id, source_path, added_at) VALUES (?1, ?2, ?3, ?4)",
                params![sid, id, path.trim(), now],
            )
            .map_err(|e| e.to_string())?;
        }
        conn.execute(
            "INSERT INTO case_billing_config (case_id, billing_type, pay_rate, rate_unit, created_at, updated_at) VALUES (?1, 'pay_rate', 150.0, 'hourly', ?2, ?2)",
            params![id, now],
        )
        .map_err(|e| e.to_string())?;
        let summary = CaseSummary {
            id: id.clone(),
            name: name.trim().to_string(),
            status: "active".to_string(),
            source_paths: source_paths.clone(),
            created_at: now.clone(),
            updated_at: now,
        };
        Ok(summary)
    })?;
    if !source_paths.is_empty() {
        with_conn_mut(&state, |conn| {
            ingest::ingest_all_sources(conn, &id, &source_paths, false, 50_000)
        })?;
    }
    get_case(id, state)
}

#[tauri::command]
fn list_cases(state: State<AppState>) -> Result<Vec<CaseSummary>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare("SELECT id, name, status, created_at, updated_at FROM cases ORDER BY updated_at DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                ))
            })
            .map_err(|e| e.to_string())?;
        let mut cases = Vec::new();
        for row in rows.flatten() {
            let mut src_stmt = conn
                .prepare("SELECT source_path FROM case_sources WHERE case_id = ?1")
                .map_err(|e| e.to_string())?;
            let sources: Vec<String> = src_stmt
                .query_map(params![row.0], |r| r.get(0))
                .map_err(|e| e.to_string())?
                .filter_map(Result::ok)
                .collect();
            cases.push(CaseSummary {
                id: row.0,
                name: row.1,
                status: row.2,
                source_paths: sources,
                created_at: row.3,
                updated_at: row.4,
            });
        }
        Ok(cases)
    })
}

#[tauri::command]
fn get_case(case_id: String, state: State<AppState>) -> Result<CaseSummary, String> {
    with_conn(&state, |conn| {
        let row: (String, String, String, String, String) = conn
            .query_row(
                "SELECT id, name, status, created_at, updated_at FROM cases WHERE id = ?1",
                params![case_id],
                |row| {
                    Ok((
                        row.get(0)?,
                        row.get(1)?,
                        row.get(2)?,
                        row.get(3)?,
                        row.get(4)?,
                    ))
                },
            )
            .map_err(|_| "case not found".to_string())?;
        let mut src_stmt = conn
            .prepare("SELECT source_path FROM case_sources WHERE case_id = ?1")
            .map_err(|e| e.to_string())?;
        let sources: Vec<String> = src_stmt
            .query_map(params![case_id], |r| r.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(Result::ok)
            .collect();
        Ok(CaseSummary {
            id: row.0,
            name: row.1,
            status: row.2,
            source_paths: sources,
            created_at: row.3,
            updated_at: row.4,
        })
    })
}

#[tauri::command]
fn update_case_metadata(
    case_id: String,
    name: Option<String>,
    status: Option<String>,
    state: State<AppState>,
) -> Result<CaseSummary, String> {
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        let now = now_iso();
        if let Some(n) = name {
            conn.execute(
                "UPDATE cases SET name = ?1, updated_at = ?2 WHERE id = ?3",
                params![n.trim(), now, case_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(s) = status {
            conn.execute(
                "UPDATE cases SET status = ?1, updated_at = ?2 WHERE id = ?3",
                params![s, now, case_id],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    })?;
    get_case(case_id, state)
}

#[tauri::command]
fn get_or_create_case(
    name: String,
    source_paths: Vec<String>,
    state: State<AppState>,
) -> Result<CaseSummary, String> {
    let cases = list_cases(state.clone())?;
    if let Some(existing) = cases.into_iter().find(|c| c.name == name.trim()) {
        return Ok(existing);
    }
    create_case(name, source_paths, state)
}

#[tauri::command]
fn delete_case(case_id: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute("DELETE FROM cases WHERE id = ?1", params![case_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn add_case_source(
    case_id: String,
    source_path: String,
    state: State<AppState>,
) -> Result<(), String> {
    if !path::is_path_string_safe(&source_path) {
        return Err("unsafe path".into());
    }
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT OR IGNORE INTO case_sources (id, case_id, source_path, added_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, case_id, source_path.trim(), now_iso()],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })?;
    with_conn_mut(&state, |conn| {
        ingest::ingest_source(conn, &case_id, source_path.trim(), false, 50_000)?;
        Ok(())
    })
}

#[tauri::command]
fn list_case_sources(case_id: String, state: State<AppState>) -> Result<Vec<String>, String> {
    state.db.list_case_roots(Some(&case_id))
}

#[tauri::command]
fn count_directory_files(path: String) -> Result<u64, String> {
    if !path::is_path_string_safe(&path) {
        return Err("unsafe path".into());
    }
    let mut count = 0u64;
    for entry in WalkDir::new(path).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            count += 1;
        }
    }
    Ok(count)
}

#[tauri::command]
fn ingest_files_to_case(
    case_id: String,
    source_path: Option<String>,
    incremental: Option<bool>,
    max_files: Option<u32>,
    state: State<AppState>,
) -> Result<ingest::IngestResult, String> {
    let limit = max_files.unwrap_or(50_000) as usize;
    let incremental = incremental.unwrap_or(true);
    with_conn_mut(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        let sources: Vec<String> = if let Some(path) = source_path.filter(|p| !p.trim().is_empty()) {
            vec![path]
        } else {
            list_sources_for_case(conn, &case_id)?
        };
        if sources.is_empty() {
            return Err("no source paths configured for case".into());
        }
        ingest::ingest_all_sources(conn, &case_id, &sources, incremental, limit)
    })
}

#[tauri::command]
fn load_case_files(case_id: String, state: State<AppState>) -> Result<Vec<CaseFile>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, case_id, file_name, absolute_path, folder_path, file_hash, file_size, modified_at, status
                 FROM files WHERE case_id = ?1 AND deleted_at IS NULL ORDER BY file_name",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(CaseFile {
                    id: row.get(0)?,
                    case_id: row.get(1)?,
                    file_name: row.get(2)?,
                    file_path: row.get(3)?,
                    folder_path: row.get(4)?,
                    file_hash: row.get(5)?,
                    size_bytes: row.get::<_, i64>(6)? as u64,
                    modified_at: row.get(7)?,
                    status: row.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn scan_directory(
    case_id: String,
    path: String,
    state: State<AppState>,
) -> Result<Vec<CaseFile>, String> {
    if !path::is_path_string_safe(&path) {
        return Err("unsafe path".into());
    }
    let root = Path::new(&path);
    let scanned = scan_files_under(root, &case_id, 5000);
    with_conn(&state, |conn| {
        for (id, cid, file_name, abs, folder, size, hash, modified) in scanned {
            let hash_opt = if hash.is_empty() { None } else { Some(hash) };
            conn.execute(
                "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status, deleted_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'unreviewed', NULL)
                 ON CONFLICT(case_id, absolute_path) DO UPDATE SET file_size = excluded.file_size, modified_at = excluded.modified_at",
                params![id, cid, file_name, folder, abs, hash_opt, size as i64, modified],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    })?;
    load_case_files(case_id, state)
}

#[tauri::command]
fn update_file_status(
    file_id: String,
    status: String,
    state: State<AppState>,
) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute(
            "UPDATE files SET status = ?1 WHERE id = ?2",
            params![status, file_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn load_case_files_with_inventory(
    case_id: String,
    state: State<AppState>,
) -> Result<Vec<CaseFile>, String> {
    load_case_files(case_id, state)
}

#[tauri::command]
fn sync_case_all_sources(
    case_id: String,
    incremental: Option<bool>,
    max_files: Option<u32>,
    state: State<AppState>,
) -> Result<ingest::IngestResult, String> {
    ingest_files_to_case(case_id, None, incremental, max_files, state)
}

#[tauri::command]
fn refresh_single_file(
    case_id: String,
    file_path: String,
    state: State<AppState>,
) -> Result<CaseFile, String> {
    let roots = state.db.list_case_roots(Some(&case_id))?;
    let safe = path::validate_safe_path(&file_path, &roots)?;
    let metadata = fs::metadata(&safe).map_err(|e| format!("failed file metadata: {e}"))?;
    if !metadata.is_file() {
        return Err("path is not a file".into());
    }
    let file_name = safe
        .file_name()
        .map(|v| v.to_string_lossy().to_string())
        .ok_or("file name unavailable")?;
    let folder = folder_path_for_file_under_roots(&safe, &roots);
    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .and_then(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0))
        .map(|d| d.to_rfc3339())
        .unwrap_or_else(now_iso);
    let hash = hash_file(&safe);
    let safe_str = safe.to_string_lossy().to_string();
    with_conn(&state, |conn| {
        let existing: Option<String> = conn
            .query_row(
                "SELECT id FROM files WHERE case_id = ?1 AND absolute_path = ?2",
                params![case_id, safe_str],
                |row| row.get(0),
            )
            .ok();
        let file_id = existing.unwrap_or_else(|| Uuid::new_v4().to_string());
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'unreviewed', NULL)
             ON CONFLICT(case_id, absolute_path) DO UPDATE SET
               file_name = excluded.file_name,
               folder_path = excluded.folder_path,
               file_hash = excluded.file_hash,
               file_size = excluded.file_size,
               modified_at = excluded.modified_at,
               deleted_at = NULL",
            params![
                file_id,
                case_id,
                file_name,
                folder,
                safe_str,
                hash,
                metadata.len() as i64,
                modified
            ],
        )
        .map_err(|e| e.to_string())?;
        let row = conn
            .query_row(
                "SELECT id, case_id, file_name, absolute_path, folder_path, file_hash, file_size, modified_at, status
                 FROM files WHERE case_id = ?1 AND absolute_path = ?2",
                params![case_id, safe_str],
                |row| {
                    Ok(CaseFile {
                        id: row.get(0)?,
                        case_id: row.get(1)?,
                        file_name: row.get(2)?,
                        file_path: row.get(3)?,
                        folder_path: row.get(4)?,
                        file_hash: row.get(5)?,
                        size_bytes: row.get::<_, i64>(6)? as u64,
                        modified_at: row.get(7)?,
                        status: row.get(8)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;
        Ok(row)
    })
}

#[tauri::command]
fn refresh_files_bulk(
    case_id: String,
    file_paths: Vec<String>,
    state: State<AppState>,
) -> Result<Vec<CaseFile>, String> {
    let mut refreshed = Vec::new();
    for file_path in file_paths {
        if let Ok(file) = refresh_single_file(case_id.clone(), file_path, state.clone()) {
            refreshed.push(file);
        }
    }
    Ok(refreshed)
}

#[tauri::command]
fn check_file_changed(
    case_id: String,
    file_id: String,
    state: State<AppState>,
) -> Result<FileChangeCheck, String> {
    with_conn(&state, |conn| {
        let row: (String, Option<String>, Option<String>) = conn
            .query_row(
                "SELECT absolute_path, file_hash, modified_at FROM files WHERE id = ?1 AND case_id = ?2 AND deleted_at IS NULL",
                params![file_id, case_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .map_err(|_| "file not found".to_string())?;
        let path = PathBuf::from(&row.0);
        let current_hash = hash_file(&path);
        let changed = current_hash != row.1;
        Ok(FileChangeCheck {
            file_id,
            changed,
        })
    })
}

#[tauri::command]
fn rename_file(
    case_id: String,
    file_id: String,
    new_name: String,
    state: State<AppState>,
) -> Result<CaseFile, String> {
    if new_name.trim().is_empty() {
        return Err("new name cannot be empty".into());
    }
    let roots = state.db.list_case_roots(Some(&case_id))?;
    with_conn(&state, |conn| {
        let row: (String, Option<String>) = conn
            .query_row(
                "SELECT absolute_path, folder_path FROM files WHERE id = ?1 AND case_id = ?2 AND deleted_at IS NULL",
                params![file_id, case_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|_| "file not found".to_string())?;
        let safe_old = path::validate_safe_path(&row.0, &roots)?;
        let parent = safe_old.parent().ok_or("parent directory unavailable")?;
        let safe_new = parent.join(new_name.trim());
        fs::rename(&safe_old, &safe_new).map_err(|e| format!("rename failed: {e}"))?;
        let hash = hash_file(&safe_new);
        let now = now_iso();
        conn.execute(
            "UPDATE files SET file_name = ?1, absolute_path = ?2, folder_path = ?3, file_hash = ?4, modified_at = ?5 WHERE id = ?6",
            params![
                new_name.trim(),
                safe_new.to_string_lossy(),
                row.1,
                hash,
                now,
                file_id
            ],
        )
        .map_err(|e| e.to_string())?;
        let updated = conn
            .query_row(
                "SELECT id, case_id, file_name, absolute_path, folder_path, file_hash, file_size, modified_at, status
                 FROM files WHERE id = ?1",
                params![file_id],
                |row| {
                    Ok(CaseFile {
                        id: row.get(0)?,
                        case_id: row.get(1)?,
                        file_name: row.get(2)?,
                        file_path: row.get(3)?,
                        folder_path: row.get(4)?,
                        file_hash: row.get(5)?,
                        size_bytes: row.get::<_, i64>(6)? as u64,
                        modified_at: row.get(7)?,
                        status: row.get(8)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;
        Ok(updated)
    })
}

#[tauri::command]
fn remove_file_from_case(
    case_id: String,
    file_id: String,
    state: State<AppState>,
) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute(
            "UPDATE files SET deleted_at = ?1 WHERE id = ?2 AND case_id = ?3",
            params![now_iso(), file_id, case_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn find_duplicate_files(case_id: String, state: State<AppState>) -> Result<Vec<DuplicateGroup>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT file_hash, GROUP_CONCAT(id), MIN(id)
                 FROM files
                 WHERE case_id = ?1 AND deleted_at IS NULL AND file_hash IS NOT NULL AND file_hash != ''
                 GROUP BY file_hash
                 HAVING COUNT(*) > 1",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                let hash: String = row.get(0)?;
                let ids_csv: String = row.get(1)?;
                let primary: String = row.get(2)?;
                let file_ids: Vec<String> = ids_csv.split(',').map(|s| s.to_string()).collect();
                Ok(DuplicateGroup {
                    group_id: hash,
                    file_ids,
                    primary_file_id: Some(primary),
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn mark_duplicate_primary(
    case_id: String,
    group_id: String,
    primary_file_id: String,
    state: State<AppState>,
) -> Result<DuplicateGroup, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id FROM files WHERE case_id = ?1 AND file_hash = ?2 AND deleted_at IS NULL ORDER BY id",
            )
            .map_err(|e| e.to_string())?;
        let file_ids: Vec<String> = stmt
            .query_map(params![case_id, group_id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(Result::ok)
            .collect();
        if file_ids.len() < 2 {
            return Err("duplicate group not found".into());
        }
        conn.execute("DELETE FROM duplicate_groups WHERE group_id = ?1", params![group_id])
            .map_err(|e| e.to_string())?;
        for file_id in &file_ids {
            conn.execute(
                "INSERT INTO duplicate_groups (group_id, file_id, is_primary, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![
                    group_id,
                    file_id,
                    if file_id == &primary_file_id { 1 } else { 0 },
                    now_iso()
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(DuplicateGroup {
            group_id,
            file_ids,
            primary_file_id: Some(primary_file_id),
        })
    })
}

pub fn merge_duplicate_metadata_conn(
    conn: &rusqlite::Connection,
    case_id: &str,
    group_id: &str,
    target_file_id: &str,
) -> Result<(), String> {
    let mut stmt = conn
        .prepare(
            "SELECT id FROM files WHERE case_id = ?1 AND file_hash = ?2 AND deleted_at IS NULL",
        )
        .map_err(|e| e.to_string())?;
    let source_ids: Vec<String> = stmt
        .query_map(params![case_id, group_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .filter(|id| id != target_file_id)
        .collect();

    for source_id in &source_ids {
        conn.execute(
            "UPDATE notes SET file_id = ?1, updated_at = ?2 WHERE file_id = ?3 AND case_id = ?4",
            params![target_file_id, now_iso(), source_id, case_id],
        )
        .map_err(|e| e.to_string())?;

        let mut finding_stmt = conn
            .prepare(
                "SELECT id, linked_files FROM findings WHERE case_id = ?1 AND linked_files IS NOT NULL",
            )
            .map_err(|e| e.to_string())?;
        let finding_rows: Vec<(String, String)> = finding_stmt
            .query_map(params![case_id], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(Result::ok)
            .collect();

        for (finding_id, linked_json) in finding_rows {
            if let Ok(mut linked) = serde_json::from_str::<Vec<String>>(&linked_json) {
                if linked.contains(source_id) {
                    linked.retain(|id| id != source_id);
                    if !linked.contains(&target_file_id.to_string()) {
                        linked.push(target_file_id.to_string());
                    }
                    let updated = serde_json::to_string(&linked).map_err(|e| e.to_string())?;
                    conn.execute(
                        "UPDATE findings SET linked_files = ?1, updated_at = ?2 WHERE id = ?3",
                        params![updated, now_iso(), finding_id],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
        }

        conn.execute(
            "UPDATE timeline_events SET source_file_id = ?1 WHERE source_file_id = ?2 AND case_id = ?3",
            params![target_file_id, source_id, case_id],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.execute(
        "UPDATE files SET status = 'reviewed' WHERE id = ?1 AND case_id = ?2",
        params![target_file_id, case_id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE files SET deleted_at = ?1 WHERE case_id = ?2 AND file_hash = ?3 AND id != ?4 AND deleted_at IS NULL",
        params![now_iso(), case_id, group_id, target_file_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn merge_duplicate_metadata(
    case_id: String,
    group_id: String,
    target_file_id: String,
    state: State<AppState>,
) -> Result<(), String> {
    with_conn(&state, |conn| {
        merge_duplicate_metadata_conn(conn, &case_id, &group_id, &target_file_id)
    })
}

#[tauri::command]
fn create_note(
    case_id: String,
    content: String,
    file_id: Option<String>,
    state: State<AppState>,
) -> Result<Note, String> {
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        if let Some(ref fid) = file_id {
            let exists: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM files WHERE id = ?1 AND case_id = ?2 AND deleted_at IS NULL",
                    params![fid, case_id],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            if exists == 0 {
                return Err("file not found in case".into());
            }
        }
        conn.execute(
            "INSERT INTO notes (id, case_id, file_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 0, ?5, ?5)",
            params![id, case_id, file_id, content, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(Note {
            id,
            case_id,
            file_id,
            content,
            pinned: false,
            created_at: now.clone(),
            updated_at: now,
        })
    })
}

#[tauri::command]
fn list_notes(case_id: String, state: State<AppState>) -> Result<Vec<Note>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, case_id, file_id, content, pinned, created_at, updated_at FROM notes WHERE case_id = ?1 ORDER BY pinned DESC, created_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], note_from_row)
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn get_file_note_counts(
    case_id: String,
    state: State<AppState>,
) -> Result<Vec<FileNoteCount>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT file_id, COUNT(*) as count FROM notes WHERE case_id = ?1 AND file_id IS NOT NULL GROUP BY file_id",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(FileNoteCount {
                    file_id: row.get(0)?,
                    count: row.get::<_, i64>(1)? as u32,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn list_case_file_metadata(
    case_id: String,
    state: State<AppState>,
) -> Result<Vec<CaseFileMetadata>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT f.id, fm.metadata_json
                 FROM files f
                 INNER JOIN file_metadata fm ON f.id = fm.file_id
                 WHERE f.case_id = ?1 AND f.deleted_at IS NULL",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(CaseFileMetadata {
                    file_id: row.get(0)?,
                    metadata_json: row.get(1)?,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn update_note(
    note_id: String,
    content: String,
    state: State<AppState>,
) -> Result<Note, String> {
    let now = now_iso();
    with_conn(&state, |conn| {
        conn.execute(
            "UPDATE notes SET content = ?1, updated_at = ?2 WHERE id = ?3",
            params![content, now, note_id],
        )
        .map_err(|e| e.to_string())?;
        conn
            .query_row(
                "SELECT id, case_id, file_id, content, pinned, created_at, updated_at FROM notes WHERE id = ?1",
                params![note_id],
                note_from_row,
            )
            .map_err(|_| "note not found".to_string())
    })
}

#[tauri::command]
fn delete_note(note_id: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute("DELETE FROM notes WHERE id = ?1", params![note_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn toggle_note_pinned(note_id: String, state: State<AppState>) -> Result<Note, String> {
    with_conn(&state, |conn| {
        conn.execute(
            "UPDATE notes SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END, updated_at = ?1 WHERE id = ?2",
            params![now_iso(), note_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })?;
    with_conn(&state, |conn| {
        conn
            .query_row(
                "SELECT id, case_id, file_id, content, pinned, created_at, updated_at FROM notes WHERE id = ?1",
                params![note_id],
                note_from_row,
            )
            .map_err(|_| "note not found".to_string())
    })
}

#[tauri::command]
fn create_finding(
    case_id: String,
    title: String,
    description: String,
    severity: Option<String>,
    linked_files: Option<Vec<String>>,
    state: State<AppState>,
) -> Result<Finding, String> {
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    let severity = severity.unwrap_or_else(|| "medium".to_string());
    let linked_json = linked_files_to_json(linked_files.clone());
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        conn.execute(
            "INSERT INTO findings (id, case_id, title, description, severity, linked_files, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
            params![id, case_id, title, description, severity, linked_json, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(Finding {
            id,
            case_id,
            title,
            description,
            severity,
            linked_files,
            created_at: now.clone(),
            updated_at: now,
        })
    })
}

#[tauri::command]
fn list_findings(case_id: String, state: State<AppState>) -> Result<Vec<Finding>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, case_id, title, description, severity, linked_files, created_at, updated_at FROM findings WHERE case_id = ?1 ORDER BY created_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(Finding {
                    id: row.get(0)?,
                    case_id: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    severity: row.get(4)?,
                    linked_files: parse_linked_files_json(row.get(5)?),
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn update_finding(
    finding_id: String,
    title: Option<String>,
    description: Option<String>,
    severity: Option<String>,
    linked_files: Option<Vec<String>>,
    state: State<AppState>,
) -> Result<Finding, String> {
    let now = now_iso();
    with_conn(&state, |conn| {
        if let Some(t) = title {
            conn.execute(
                "UPDATE findings SET title = ?1, updated_at = ?2 WHERE id = ?3",
                params![t, now, finding_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(d) = description {
            conn.execute(
                "UPDATE findings SET description = ?1, updated_at = ?2 WHERE id = ?3",
                params![d, now, finding_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(s) = severity {
            conn.execute(
                "UPDATE findings SET severity = ?1, updated_at = ?2 WHERE id = ?3",
                params![s, now, finding_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(files) = linked_files {
            let json = linked_files_to_json(Some(files));
            conn.execute(
                "UPDATE findings SET linked_files = ?1, updated_at = ?2 WHERE id = ?3",
                params![json, now, finding_id],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    })?;
    with_conn(&state, |conn| {
        conn
            .query_row(
                "SELECT id, case_id, title, description, severity, linked_files, created_at, updated_at FROM findings WHERE id = ?1",
                params![finding_id],
                |row| {
                    Ok(Finding {
                        id: row.get(0)?,
                        case_id: row.get(1)?,
                        title: row.get(2)?,
                        description: row.get(3)?,
                        severity: row.get(4)?,
                        linked_files: parse_linked_files_json(row.get(5)?),
                        created_at: row.get(6)?,
                        updated_at: row.get(7)?,
                    })
                },
            )
            .map_err(|_| "finding not found".to_string())
    })
}

#[tauri::command]
fn delete_finding(finding_id: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute("DELETE FROM findings WHERE id = ?1", params![finding_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn create_timeline_event(
    case_id: String,
    description: String,
    occurred_at: Option<String>,
    event_type: Option<String>,
    source_file_id: Option<String>,
    state: State<AppState>,
) -> Result<TimelineEvent, String> {
    let id = Uuid::new_v4().to_string();
    let occurred = occurred_at.unwrap_or_else(now_iso);
    let created = now_iso();
    let event_type = event_type.unwrap_or_else(|| "manual".to_string());
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        if let Some(ref fid) = source_file_id {
            let exists: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM files WHERE id = ?1 AND case_id = ?2 AND deleted_at IS NULL",
                    params![fid, case_id],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            if exists == 0 {
                return Err("file not found in case".into());
            }
        }
        conn.execute(
            "INSERT INTO timeline_events (id, case_id, description, occurred_at, source_file_id, event_type, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, case_id, description, occurred, source_file_id, event_type, created],
        )
        .map_err(|e| e.to_string())?;
        Ok(TimelineEvent {
            id,
            case_id,
            description,
            occurred_at: occurred,
            event_type,
            source_file_id,
            created_at: created,
        })
    })
}

#[tauri::command]
fn list_timeline_events(
    case_id: String,
    state: State<AppState>,
) -> Result<Vec<TimelineEvent>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, case_id, description, occurred_at, event_type, source_file_id, created_at FROM timeline_events WHERE case_id = ?1 ORDER BY occurred_at ASC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(TimelineEvent {
                    id: row.get(0)?,
                    case_id: row.get(1)?,
                    description: row.get(2)?,
                    occurred_at: row.get(3)?,
                    event_type: row.get(4)?,
                    source_file_id: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn update_timeline_event(
    event_id: String,
    description: Option<String>,
    occurred_at: Option<String>,
    event_type: Option<String>,
    source_file_id: Option<String>,
    state: State<AppState>,
) -> Result<TimelineEvent, String> {
    with_conn(&state, |conn| {
        if let Some(d) = description {
            conn.execute(
                "UPDATE timeline_events SET description = ?1 WHERE id = ?2",
                params![d, event_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(o) = occurred_at {
            conn.execute(
                "UPDATE timeline_events SET occurred_at = ?1 WHERE id = ?2",
                params![o, event_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(t) = event_type {
            conn.execute(
                "UPDATE timeline_events SET event_type = ?1 WHERE id = ?2",
                params![t, event_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(fid) = source_file_id {
            conn.execute(
                "UPDATE timeline_events SET source_file_id = ?1 WHERE id = ?2",
                params![fid, event_id],
            )
            .map_err(|e| e.to_string())?;
        }
        conn
            .query_row(
                "SELECT id, case_id, description, occurred_at, event_type, source_file_id, created_at FROM timeline_events WHERE id = ?1",
                params![event_id],
                |row| {
                    Ok(TimelineEvent {
                        id: row.get(0)?,
                        case_id: row.get(1)?,
                        description: row.get(2)?,
                        occurred_at: row.get(3)?,
                        event_type: row.get(4)?,
                        source_file_id: row.get(5)?,
                        created_at: row.get(6)?,
                    })
                },
            )
            .map_err(|_| "timeline event not found".to_string())
    })
}

const SYSTEM_FILE_FILTER_KEY: &str = "system_file_filter";

#[tauri::command]
fn get_system_file_filter_config(state: State<AppState>) -> Result<Option<String>, String> {
    with_conn(&state, |conn| {
        conn.query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            params![SYSTEM_FILE_FILTER_KEY],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())
    })
}

#[tauri::command]
fn save_system_file_filter_config(patterns: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute(
            "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
            params![SYSTEM_FILE_FILTER_KEY, patterns, now_iso()],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn delete_timeline_event(event_id: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute("DELETE FROM timeline_events WHERE id = ?1", params![event_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn get_column_config_db(case_id: String, state: State<AppState>) -> Result<Option<String>, String> {
    with_conn(&state, |conn| {
        let config = conn
            .query_row(
                "SELECT config_data FROM column_configs WHERE case_id = ?1",
                params![case_id],
                |row| row.get::<_, String>(0),
            )
            .ok();
        Ok(config)
    })
}

#[tauri::command]
fn save_column_config_db(case_id: String, config_data: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute(
            "INSERT INTO column_configs (case_id, config_data, updated_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(case_id) DO UPDATE SET config_data = excluded.config_data, updated_at = excluded.updated_at",
            params![case_id, config_data, now_iso()],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn get_mapping_config_db(case_id: String, state: State<AppState>) -> Result<Option<String>, String> {
    with_conn(&state, |conn| {
        let config = conn
            .query_row(
                "SELECT config_data FROM mapping_configs WHERE case_id = ?1",
                params![case_id],
                |row| row.get::<_, String>(0),
            )
            .ok();
        Ok(config)
    })
}

#[tauri::command]
fn save_mapping_config_db(case_id: String, config_data: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute(
            "INSERT INTO mapping_configs (case_id, config_data, updated_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(case_id) DO UPDATE SET config_data = excluded.config_data, updated_at = excluded.updated_at",
            params![case_id, config_data, now_iso()],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

fn reapply_mappings_inner(
    conn: &rusqlite::Connection,
    case_id: &str,
) -> Result<u32, String> {
    use field_extraction::{apply_mapping_rule, folder_name_from_path, parse_mapping_rule, RegexCache};
    use std::collections::HashMap;

    let mapping_config_json: Option<String> = conn
        .query_row(
            "SELECT config_data FROM mapping_configs WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .ok();

    let Some(mapping_config_json) = mapping_config_json else {
        return Ok(0);
    };

    let mapping_config: serde_json::Value = serde_json::from_str(&mapping_config_json)
        .map_err(|e| format!("Failed to parse mapping config: {e}"))?;

    let mappings = mapping_config
        .get("mappings")
        .and_then(|m| m.as_array())
        .cloned()
        .unwrap_or_default();

    if mappings.is_empty() {
        return Ok(0);
    }

    let rules: Vec<_> = mappings
        .iter()
        .filter_map(parse_mapping_rule)
        .collect();

    if rules.is_empty() {
        return Ok(0);
    }

    let mut stmt = conn
        .prepare(
            "SELECT f.id, f.file_name, f.folder_path, fm.metadata_json
             FROM files f
             LEFT JOIN file_metadata fm ON f.id = fm.file_id
             WHERE f.case_id = ?1 AND f.deleted_at IS NULL",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![case_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut regex_cache = RegexCache::new();
    let mut updated_count = 0u32;

    for (file_id, file_name, folder_path_opt, existing_metadata) in rows {
        let folder_path = folder_path_opt.unwrap_or_default();
        let folder_name = folder_name_from_path(&folder_path);

        let mut metadata_obj: serde_json::Value = existing_metadata
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_else(|| serde_json::json!({}));

        let mut metadata_map = HashMap::new();
        metadata_map.insert("file_name".to_string(), file_name.clone());
        metadata_map.insert("folder_name".to_string(), folder_name.clone());
        metadata_map.insert("folder_path".to_string(), folder_path.clone());

        if let Some(obj) = metadata_obj.as_object() {
            for (key, value) in obj {
                if let Some(s) = value.as_str() {
                    metadata_map.insert(key.clone(), s.to_string());
                }
            }
        }

        let mut inventory = metadata_obj
            .get("inventory")
            .and_then(|v| v.as_object())
            .cloned()
            .unwrap_or_default();

        for rule in &rules {
            if let Ok(Some(extracted)) = apply_mapping_rule(
                rule,
                &file_name,
                &folder_name,
                &folder_path,
                &metadata_map,
                &mut regex_cache,
            ) {
                inventory.insert(
                    rule.target_field.clone(),
                    serde_json::Value::String(extracted),
                );
            }
        }

        if let Some(obj) = metadata_obj.as_object_mut() {
            obj.insert(
                "inventory".to_string(),
                serde_json::Value::Object(inventory),
            );
        } else {
            metadata_obj = serde_json::json!({ "inventory": inventory });
        }

        let metadata_json = serde_json::to_string(&metadata_obj)
            .map_err(|e| format!("Failed to serialize metadata: {e}"))?;

        conn.execute(
            "INSERT INTO file_metadata (file_id, metadata_json, extracted_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(file_id) DO UPDATE SET metadata_json = excluded.metadata_json, extracted_at = excluded.extracted_at",
            params![file_id, metadata_json, now_iso()],
        )
        .map_err(|e| e.to_string())?;

        updated_count += 1;
    }

    Ok(updated_count)
}

#[tauri::command]
fn reapply_mappings_to_case(case_id: String, state: State<AppState>) -> Result<u32, String> {
    with_conn(&state, |conn| reapply_mappings_inner(conn, &case_id))
}

#[tauri::command]
fn get_workspace_preferences_db(
    case_id: String,
    state: State<AppState>,
) -> Result<Option<String>, String> {
    with_conn(&state, |conn| {
        let prefs = conn
            .query_row(
                "SELECT prefs_data FROM workspace_preferences WHERE case_id = ?1",
                params![case_id],
                |row| row.get::<_, String>(0),
            )
            .ok();
        Ok(prefs)
    })
}

#[tauri::command]
fn save_workspace_preferences_db(
    case_id: String,
    prefs_data: String,
    state: State<AppState>,
) -> Result<(), String> {
    with_conn(&state, |conn| {
        conn.execute(
            "INSERT INTO workspace_preferences (case_id, prefs_data, updated_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(case_id) DO UPDATE SET prefs_data = excluded.prefs_data, updated_at = excluded.updated_at",
            params![case_id, prefs_data, now_iso()],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
fn extract_file_metadata(
    case_id: String,
    file_id: String,
    state: State<AppState>,
) -> Result<String, String> {
    let roots = state.db.list_case_roots(Some(&case_id))?;
    with_conn(&state, |conn| {
        let row: (String, String, i64, Option<String>) = conn
            .query_row(
                "SELECT absolute_path, file_name, file_size, modified_at FROM files WHERE id = ?1 AND case_id = ?2 AND deleted_at IS NULL",
                params![file_id, case_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .map_err(|_| "file not found".to_string())?;
        let safe = path::validate_safe_path(&row.0, &roots)?;
        let ext = safe
            .extension()
            .map(|e| e.to_string_lossy().to_string())
            .unwrap_or_default();
        let metadata_json = serde_json::json!({
            "fileName": row.1,
            "absolutePath": row.0,
            "extension": ext,
            "sizeBytes": row.2,
            "modifiedAt": row.3.unwrap_or_else(now_iso),
        })
        .to_string();
        conn.execute(
            "INSERT INTO file_metadata (file_id, metadata_json, extracted_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(file_id) DO UPDATE SET metadata_json = excluded.metadata_json, extracted_at = excluded.extracted_at",
            params![file_id, metadata_json.clone(), now_iso()],
        )
        .map_err(|e| e.to_string())?;
        Ok(metadata_json)
    })
}

pub fn fts_search(
    conn: &rusqlite::Connection,
    case_id: &str,
    query: &str,
    limit: u32,
) -> Result<Vec<SearchHit>, String> {
    let sanitized = search::sanitize_fts_query(query);
    if sanitized.is_empty() {
        return Ok(vec![]);
    }
    let term = format!("{sanitized}*");
    let lim = limit as i64;
    let mut hits = Vec::new();

    let mut file_stmt = conn
        .prepare(
            r#"
            SELECT f.id, f.file_name, f.folder_path
            FROM files_fts fts
            JOIN files f ON f.rowid = fts.rowid
            WHERE files_fts MATCH ?1 AND f.case_id = ?2 AND f.deleted_at IS NULL
            LIMIT ?3
            "#,
        )
        .map_err(|e| e.to_string())?;
    let file_rows = file_stmt
        .query_map(params![term, case_id, lim], |row| {
            Ok(SearchHit {
                id: row.get(0)?,
                entity_type: "file".to_string(),
                title: row.get(1)?,
                snippet: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?;
    hits.extend(file_rows.filter_map(Result::ok));

    let mut note_stmt = conn
        .prepare(
            r#"
            SELECT n.id, substr(n.content, 1, 80)
            FROM notes_fts fts
            JOIN notes n ON n.rowid = fts.rowid
            WHERE notes_fts MATCH ?1 AND n.case_id = ?2
            LIMIT ?3
            "#,
        )
        .map_err(|e| e.to_string())?;
    let note_rows = note_stmt
        .query_map(params![term, case_id, lim], |row| {
            Ok(SearchHit {
                id: row.get(0)?,
                entity_type: "note".to_string(),
                title: "Note".to_string(),
                snippet: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;
    hits.extend(note_rows.filter_map(Result::ok));

    let mut finding_stmt = conn
        .prepare(
            r#"
            SELECT f.id, f.title, substr(f.description, 1, 80)
            FROM findings_fts fts
            JOIN findings f ON f.rowid = fts.rowid
            WHERE findings_fts MATCH ?1 AND f.case_id = ?2
            LIMIT ?3
            "#,
        )
        .map_err(|e| e.to_string())?;
    let finding_rows = finding_stmt
        .query_map(params![term, case_id, lim], |row| {
            Ok(SearchHit {
                id: row.get(0)?,
                entity_type: "finding".to_string(),
                title: row.get(1)?,
                snippet: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    hits.extend(finding_rows.filter_map(Result::ok));

    let mut timeline_stmt = conn
        .prepare(
            r#"
            SELECT t.id, substr(t.description, 1, 60), substr(t.description, 1, 120)
            FROM timeline_events_fts fts
            JOIN timeline_events t ON t.rowid = fts.rowid
            WHERE timeline_events_fts MATCH ?1 AND t.case_id = ?2
            LIMIT ?3
            "#,
        )
        .map_err(|e| e.to_string())?;
    let timeline_rows = timeline_stmt
        .query_map(params![term, case_id, lim], |row| {
            Ok(SearchHit {
                id: row.get(0)?,
                entity_type: "timeline".to_string(),
                title: row.get(1)?,
                snippet: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    hits.extend(timeline_rows.filter_map(Result::ok));

    Ok(hits)
}

#[tauri::command]
fn search_files(
    case_id: String,
    query: String,
    limit: Option<u32>,
    state: State<AppState>,
) -> Result<Vec<SearchHit>, String> {
    with_conn(&state, |conn| fts_search(conn, &case_id, &query, limit.unwrap_or(50)))
}

#[tauri::command]
fn search_notes(
    case_id: String,
    query: String,
    limit: Option<u32>,
    state: State<AppState>,
) -> Result<Vec<SearchHit>, String> {
    with_conn(&state, |conn| {
        let sanitized = search::sanitize_fts_query(&query);
        if sanitized.is_empty() {
            return Ok(vec![]);
        }
        let term = format!("{sanitized}*");
        let mut stmt = conn
            .prepare(
                r#"
                SELECT n.id, substr(n.content, 1, 120)
                FROM notes_fts fts
                JOIN notes n ON n.rowid = fts.rowid
                WHERE notes_fts MATCH ?1 AND n.case_id = ?2
                LIMIT ?3
                "#,
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![term, case_id, limit.unwrap_or(50)], |row| {
                Ok(SearchHit {
                    id: row.get(0)?,
                    entity_type: "note".to_string(),
                    title: "Note".to_string(),
                    snippet: row.get(1)?,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn search_all(
    case_id: String,
    query: String,
    limit: Option<u32>,
    state: State<AppState>,
) -> Result<Vec<SearchHit>, String> {
    with_conn(&state, |conn| fts_search(conn, &case_id, &query, limit.unwrap_or(50)))
}

#[tauri::command]
async fn check_for_update(app: AppHandle) -> Result<Option<UpdateCheckResult>, String> {
    #[cfg(desktop)]
    {
        use tauri_plugin_updater::UpdaterExt;

        let updater = match app.updater() {
            Ok(updater) => updater,
            Err(_) => return Ok(None),
        };

        match updater.check().await {
            Ok(Some(update)) => Ok(Some(UpdateCheckResult {
                version: update.version,
                current_version: update.current_version,
            })),
            Ok(None) | Err(_) => Ok(None),
        }
    }
    #[cfg(not(desktop))]
    {
        let _ = app;
        Ok(None)
    }
}

#[tauri::command]
fn read_file_text(
    case_id: String,
    path: String,
    state: State<AppState>,
) -> Result<String, String> {
    let roots = state.db.list_case_roots(Some(&case_id))?;
    let safe = path::validate_safe_path(&path, &roots)?;
    fs::read_to_string(safe).map_err(|e| format!("failed to read file: {e}"))
}

#[tauri::command]
fn write_file_text(
    case_id: String,
    path: String,
    content: String,
    state: State<AppState>,
) -> Result<(), String> {
    let roots = state.db.list_case_roots(Some(&case_id))?;
    let safe = path::validate_safe_path(&path, &roots)?;
    fs::write(safe, content).map_err(|e| format!("failed to write file: {e}"))
}

#[tauri::command]
fn read_file_base64(
    case_id: String,
    path: String,
    state: State<AppState>,
) -> Result<String, String> {
    let roots = state.db.list_case_roots(Some(&case_id))?;
    let safe = path::validate_safe_path(&path, &roots)?;
    let data = fs::read(safe).map_err(|e| format!("failed to read file: {e}"))?;
    Ok(STANDARD.encode(data))
}

#[tauri::command]
fn open_file(case_id: String, path: String, state: State<AppState>) -> Result<String, String> {
    let roots = state.db.list_case_roots(Some(&case_id))?;
    let safe = path::validate_safe_path(&path, &roots)?;
    Ok(safe.to_string_lossy().to_string())
}

#[tauri::command]
fn run_ocr_preview(
    case_id: String,
    file_path: String,
    state: State<AppState>,
) -> Result<String, String> {
    let roots = state.db.list_case_roots(Some(&case_id))?;
    let safe = path::validate_safe_path(&file_path, &roots)?;
    Ok(format!(
        "OCR fallback preview for {}. AI phase required for full extraction.",
        safe.display()
    ))
}

fn export_dir(app: &AppHandle, case_id: &str) -> Result<PathBuf, String> {
    let mut dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?;
    dir.push("exports");
    dir.push(case_id);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Used by Tauri commands and integration tests (`tests/command_parity.rs`).
pub fn build_report_body(case_id: &str, conn: &rusqlite::Connection, kind: &str) -> Result<String, String> {
    let case_name: String = conn
        .query_row(
            "SELECT name FROM cases WHERE id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|_| "case not found".to_string())?;
    let file_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM files WHERE case_id = ?1 AND deleted_at IS NULL",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let notes: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM notes WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let findings: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM findings WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let timeline: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM timeline_events WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let _ = (notes, findings, timeline);
    // Billing computed inline below
    let (total_seconds, amount, _) =
        time_tracking::compute_case_billing_totals(conn, case_id)?;
    let total_minutes = total_seconds / 60;

    match kind {
        "narrative" => Ok(format!(
            "# Narrative Report — {case_name}\n\nGenerated: {}\n\n## Summary\nCase contains {file_count} evidence files, {notes} notes, {findings} findings, and {timeline} timeline events.\n\n## Narrative\nThis report synthesizes investigator work product for deliverable review.\n",
            now_iso(),
        )),
        "executive" => Ok(format!(
            "# Executive Summary — {case_name}\n\n- Files reviewed: {file_count}\n- Key findings: {findings}\n- Timeline events: {timeline}\n- Billable amount: ${amount:.2}\n",
        )),
        "evidence_index" => {
            let mut stmt = conn
                .prepare(
                    "SELECT file_name, absolute_path, status FROM files WHERE case_id = ?1 AND deleted_at IS NULL ORDER BY file_name LIMIT 5000",
                )
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map(params![case_id], |row| {
                    Ok(format!(
                        "- {} | {} | {}",
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?
                    ))
                })
                .map_err(|e| e.to_string())?;
            let list: String = rows.filter_map(Result::ok).collect::<Vec<_>>().join("\n");
            Ok(format!(
                "# Evidence Index — {case_name}\n\n{list}\n",
            ))
        }
        "financial" => Ok(format!(
            "# Financial Package — {case_name}\n\nTotal billable minutes: {total_minutes}\nComputed amount: ${amount:.2}\nFiles in scope: {file_count}\n",
        )),
        "billing_invoice" => Ok(format!(
            "# Billing Invoice — {case_name}\n\nInvoice date: {}\nBillable minutes: {total_minutes}\nAmount due: ${amount:.2}\n",
            now_iso()
        )),
        _ => Err("unknown report type".into()),
    }
}

#[tauri::command]
fn export_case_report(
    case_id: String,
    report_type: String,
    app: AppHandle,
    state: State<AppState>,
) -> Result<ReportExport, String> {
    let body = with_conn(&state, |conn| build_report_body(&case_id, conn, &report_type))?;
    let dir = export_dir(&app, &case_id)?;
    let file_name = format!("{}-{}-{}.md", case_id, report_type, unix_now());
    let file_path = dir.join(&file_name);
    fs::write(&file_path, body).map_err(|e| e.to_string())?;
    let generated_at = now_iso();
    let export = ReportExport {
        report_type: report_type.clone(),
        file_path: file_path.to_string_lossy().to_string(),
        generated_at: generated_at.clone(),
    };
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO report_export_history (id, case_id, report_type, file_path, generated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, case_id, report_type, export.file_path, generated_at],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })?;
    Ok(export)
}

#[tauri::command]
fn list_report_exports(
    case_id: String,
    state: State<AppState>,
) -> Result<Vec<ReportExportHistoryEntry>, String> {
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        let mut stmt = conn
            .prepare(
                "SELECT id, case_id, report_type, file_path, generated_at
                 FROM report_export_history
                 WHERE case_id = ?1
                 ORDER BY generated_at DESC
                 LIMIT 100",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(ReportExportHistoryEntry {
                    id: row.get(0)?,
                    case_id: row.get(1)?,
                    report_type: row.get(2)?,
                    file_path: row.get(3)?,
                    generated_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn generate_case_report(case_id: String, state: State<AppState>) -> Result<String, String> {
    with_conn(&state, |conn| build_report_body(&case_id, conn, "narrative"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_process::init());
    }

    builder
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("app data dir: {e}"))?;
            std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
            let db = Database::open(&db_path(&data_dir))?;
            let _ = db.import_json_store(&legacy_json_path(&data_dir));
            app.manage(AppState { db });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_case,
            list_cases,
            get_case,
            update_case_metadata,
            get_or_create_case,
            delete_case,
            add_case_source,
            list_case_sources,
            count_directory_files,
            ingest_files_to_case,
            load_case_files,
            load_case_files_with_inventory,
            sync_case_all_sources,
            refresh_single_file,
            refresh_files_bulk,
            check_file_changed,
            scan_directory,
            rename_file,
            remove_file_from_case,
            update_file_status,
            find_duplicate_files,
            mark_duplicate_primary,
            merge_duplicate_metadata,
            create_note,
            list_notes,
            get_file_note_counts,
            list_case_file_metadata,
            update_note,
            delete_note,
            toggle_note_pinned,
            create_finding,
            list_findings,
            update_finding,
            delete_finding,
            create_timeline_event,
            list_timeline_events,
            update_timeline_event,
            delete_timeline_event,
            get_system_file_filter_config,
            save_system_file_filter_config,
            time_tracking::start_timer,
            time_tracking::stop_timer,
            time_tracking::pause_timer,
            time_tracking::resume_timer,
            time_tracking::get_time_entries,
            time_tracking::get_time_entry,
            time_tracking::get_time_entries_summary,
            time_tracking::get_active_timer,
            time_tracking::update_time_entry,
            time_tracking::create_time_segment,
            time_tracking::update_time_segment,
            time_tracking::delete_time_segment,
            time_tracking::delete_time_entry,
            time_tracking::get_case_billing_config,
            time_tracking::set_case_billing_config,
            time_tracking::calculate_billing_amount,
            time_tracking::calculate_case_total,
            get_column_config_db,
            save_column_config_db,
            get_mapping_config_db,
            save_mapping_config_db,
            reapply_mappings_to_case,
            get_workspace_preferences_db,
            save_workspace_preferences_db,
            search_files,
            search_notes,
            search_all,
            read_file_text,
            write_file_text,
            read_file_base64,
            open_file,
            extract_file_metadata,
            run_ocr_preview,
            export_case_report,
            list_report_exports,
            generate_case_report,
            check_for_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod parity_unit {
    use super::*;
    use crate::database::Database;
    use std::path::Path;

    #[test]
    fn relative_folder_path_strips_case_root() {
        let root = Path::new("/cases/divorce-case-2024");
        let file = Path::new(
            "/cases/divorce-case-2024/01-legal-documents/court-orders/notice.pdf",
        );
        assert_eq!(
            relative_folder_path(file, root).as_deref(),
            Some("01-legal-documents/court-orders")
        );
        let at_root = Path::new("/cases/divorce-case-2024/readme.txt");
        assert_eq!(relative_folder_path(at_root, root), None);
    }

    #[test]
    fn json_migration_imports_legacy_store() {
        let dir = std::env::temp_dir().join(format!("casespace-json-{}", Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let json = dir.join("casespace-v2-store.json");
        std::fs::write(
            &json,
            r#"{"cases":{"c1":{"id":"c1","name":"Legacy","status":"active","source_paths":["/tmp"],"created_at":"2020-01-01T00:00:00Z","updated_at":"2020-01-01T00:00:00Z"}},"notes":[],"findings":[],"timeline_events":[],"time_entries":[],"inventory_items":[]}"#,
        )
        .unwrap();
        let db_path = dir.join("casespace.db");
        let db = Database::open(&db_path).unwrap();
        assert!(db.import_json_store(&json).unwrap());
        let count: i64 = db
            .with_connection(|conn| {
                conn.query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))
                    .map_err(|e| e.to_string())
            })
            .unwrap();
        assert_eq!(count, 1);
    }
}
