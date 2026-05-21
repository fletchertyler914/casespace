pub mod database;
pub mod path;
mod search;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::Utc;
use database::{db_path, legacy_json_path, Database};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;
use walkdir::WalkDir;

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn unix_now() -> i64 {
    Utc::now().timestamp()
}

struct AppState {
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
    content: String,
    pinned: bool,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Finding {
    id: String,
    case_id: String,
    title: String,
    description: String,
    severity: String,
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
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TimeEntry {
    id: String,
    case_id: String,
    started_at: String,
    ended_at: Option<String>,
    billable_minutes: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchHit {
    id: String,
    entity_type: String,
    title: String,
    snippet: String,
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
struct BillingSummary {
    case_id: String,
    total_minutes: i64,
    amount: f64,
    billing_type: String,
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

fn with_conn<F, T>(state: &State<AppState>, f: F) -> Result<T, String>
where
    F: FnOnce(&rusqlite::Connection) -> Result<T, String>,
{
    let db = state.db.conn.lock().map_err(|_| "db lock poisoned")?;
    f(&db)
}

fn case_exists(conn: &rusqlite::Connection, case_id: &str) -> Result<bool, String> {
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
        let folder = entry
            .path()
            .parent()
            .map(|p| p.to_string_lossy().to_string());
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
        Ok(CaseSummary {
            id: id.clone(),
            name: name.trim().to_string(),
            status: "active".to_string(),
            source_paths,
            created_at: now.clone(),
            updated_at: now,
        })
    })
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
    max_files: Option<u32>,
    state: State<AppState>,
) -> Result<u64, String> {
    let limit = max_files.unwrap_or(50_000) as usize;
    let roots = state.db.list_case_roots(Some(&case_id))?;
    if roots.is_empty() {
        return Err("no source paths configured for case".into());
    }
    let mut ingested = 0u64;
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        for root in roots {
            let root_path = Path::new(&root);
            if !root_path.exists() {
                continue;
            }
            for (id, cid, file_name, abs, folder, size, hash, modified) in
                scan_files_under(root_path, &case_id, limit)
            {
                let hash_opt = if hash.is_empty() { None } else { Some(hash) };
                conn.execute(
                    "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status, deleted_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'unreviewed', NULL)
                     ON CONFLICT(case_id, absolute_path) DO UPDATE SET
                       file_name = excluded.file_name,
                       file_size = excluded.file_size,
                       modified_at = excluded.modified_at,
                       file_hash = excluded.file_hash,
                       deleted_at = NULL",
                    params![
                        id,
                        cid,
                        file_name,
                        folder,
                        abs,
                        hash_opt,
                        size as i64,
                        modified
                    ],
                )
                .map_err(|e| e.to_string())?;
                ingested += 1;
            }
        }
        conn.execute(
            "UPDATE cases SET updated_at = ?1 WHERE id = ?2",
            params![now_iso(), case_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(ingested)
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
    max_files: Option<u32>,
    state: State<AppState>,
) -> Result<u64, String> {
    ingest_files_to_case(case_id, max_files, state)
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
    let folder = safe.parent().map(|v| v.to_string_lossy().to_string());
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

#[tauri::command]
fn merge_duplicate_metadata(
    case_id: String,
    group_id: String,
    target_file_id: String,
    state: State<AppState>,
) -> Result<(), String> {
    with_conn(&state, |conn| {
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
    })
}

#[tauri::command]
fn create_note(
    case_id: String,
    content: String,
    state: State<AppState>,
) -> Result<Note, String> {
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        conn.execute(
            "INSERT INTO notes (id, case_id, file_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, NULL, ?3, 0, ?4, ?4)",
            params![id, case_id, content, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(Note {
            id,
            case_id,
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
                "SELECT id, case_id, content, pinned, created_at, updated_at FROM notes WHERE case_id = ?1 ORDER BY pinned DESC, created_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(Note {
                    id: row.get(0)?,
                    case_id: row.get(1)?,
                    content: row.get(2)?,
                    pinned: row.get::<_, i64>(3)? != 0,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
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
        let row: (String, String, String, i64, String, String) = conn
            .query_row(
                "SELECT id, case_id, content, pinned, created_at, updated_at FROM notes WHERE id = ?1",
                params![note_id],
                |row| {
                    Ok((
                        row.get(0)?,
                        row.get(1)?,
                        row.get(2)?,
                        row.get(3)?,
                        row.get(4)?,
                        row.get(5)?,
                    ))
                },
            )
            .map_err(|_| "note not found".to_string())?;
        Ok(Note {
            id: row.0,
            case_id: row.1,
            content: row.2,
            pinned: row.3 != 0,
            created_at: row.4,
            updated_at: row.5,
        })
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
        let row: (String, String, String, i64, String, String) = conn
            .query_row(
                "SELECT id, case_id, content, pinned, created_at, updated_at FROM notes WHERE id = ?1",
                params![note_id],
                |row| {
                    Ok((
                        row.get(0)?,
                        row.get(1)?,
                        row.get(2)?,
                        row.get(3)?,
                        row.get(4)?,
                        row.get(5)?,
                    ))
                },
            )
            .map_err(|_| "note not found".to_string())?;
        Ok(Note {
            id: row.0,
            case_id: row.1,
            content: row.2,
            pinned: row.3 != 0,
            created_at: row.4,
            updated_at: row.5,
        })
    })
}

#[tauri::command]
fn create_finding(
    case_id: String,
    title: String,
    description: String,
    state: State<AppState>,
) -> Result<Finding, String> {
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        conn.execute(
            "INSERT INTO findings (id, case_id, title, description, severity, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 'medium', ?5, ?5)",
            params![id, case_id, title, description, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(Finding {
            id,
            case_id,
            title,
            description,
            severity: "medium".to_string(),
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
                "SELECT id, case_id, title, description, severity, created_at, updated_at FROM findings WHERE case_id = ?1 ORDER BY created_at DESC",
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
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
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
        Ok(())
    })?;
    with_conn(&state, |conn| {
        let row: (String, String, String, String, String, String, String) = conn
            .query_row(
                "SELECT id, case_id, title, description, severity, created_at, updated_at FROM findings WHERE id = ?1",
                params![finding_id],
                |row| {
                    Ok((
                        row.get(0)?,
                        row.get(1)?,
                        row.get(2)?,
                        row.get(3)?,
                        row.get(4)?,
                        row.get(5)?,
                        row.get(6)?,
                    ))
                },
            )
            .map_err(|_| "finding not found".to_string())?;
        Ok(Finding {
            id: row.0,
            case_id: row.1,
            title: row.2,
            description: row.3,
            severity: row.4,
            created_at: row.5,
            updated_at: row.6,
        })
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
    state: State<AppState>,
) -> Result<TimelineEvent, String> {
    let id = Uuid::new_v4().to_string();
    let occurred = occurred_at.unwrap_or_else(now_iso);
    let created = now_iso();
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        conn.execute(
            "INSERT INTO timeline_events (id, case_id, description, occurred_at, source_file_id, event_type, created_at) VALUES (?1, ?2, ?3, ?4, NULL, 'manual', ?5)",
            params![id, case_id, description, occurred, created],
        )
        .map_err(|e| e.to_string())?;
        Ok(TimelineEvent {
            id,
            case_id,
            description,
            occurred_at: occurred,
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
                "SELECT id, case_id, description, occurred_at, created_at FROM timeline_events WHERE case_id = ?1 ORDER BY occurred_at ASC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(TimelineEvent {
                    id: row.get(0)?,
                    case_id: row.get(1)?,
                    description: row.get(2)?,
                    occurred_at: row.get(3)?,
                    created_at: row.get(4)?,
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
        let row: (String, String, String, String, String) = conn
            .query_row(
                "SELECT id, case_id, description, occurred_at, created_at FROM timeline_events WHERE id = ?1",
                params![event_id],
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
            .map_err(|_| "timeline event not found".to_string())?;
        Ok(TimelineEvent {
            id: row.0,
            case_id: row.1,
            description: row.2,
            occurred_at: row.3,
            created_at: row.4,
        })
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
fn start_timer(case_id: String, state: State<AppState>) -> Result<TimeEntry, String> {
    let id = Uuid::new_v4().to_string();
    let started = now_iso();
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        conn.execute("DELETE FROM active_timers WHERE case_id = ?1", params![case_id])
            .ok();
        conn.execute(
            "INSERT INTO time_entries (id, case_id, started_at, ended_at, billable_minutes) VALUES (?1, ?2, ?3, NULL, 0)",
            params![id, case_id, started],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO active_timers (case_id, entry_id, started_at) VALUES (?1, ?2, ?3)",
            params![case_id, id, started],
        )
        .map_err(|e| e.to_string())?;
        Ok(TimeEntry {
            id,
            case_id,
            started_at: started,
            ended_at: None,
            billable_minutes: 0,
        })
    })
}

#[tauri::command]
fn stop_timer(entry_id: String, state: State<AppState>) -> Result<TimeEntry, String> {
    let ended = now_iso();
    with_conn(&state, |conn| {
        let row: (String, String, String) = conn
            .query_row(
                "SELECT id, case_id, started_at FROM time_entries WHERE id = ?1",
                params![entry_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .map_err(|_| "timer entry not found".to_string())?;
        let started = chrono::DateTime::parse_from_rfc3339(&row.2)
            .map_err(|e| e.to_string())?;
        let end = chrono::DateTime::parse_from_rfc3339(&ended).map_err(|e| e.to_string())?;
        let minutes = (end.timestamp() - started.timestamp()).max(0) / 60;
        conn.execute(
            "UPDATE time_entries SET ended_at = ?1, billable_minutes = ?2 WHERE id = ?3",
            params![ended, minutes, entry_id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM active_timers WHERE case_id = ?1",
            params![row.1],
        )
        .map_err(|e| e.to_string())?;
        Ok(TimeEntry {
            id: row.0,
            case_id: row.1,
            started_at: row.2,
            ended_at: Some(ended),
            billable_minutes: minutes,
        })
    })
}

#[tauri::command]
fn get_time_entries(case_id: String, state: State<AppState>) -> Result<Vec<TimeEntry>, String> {
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, case_id, started_at, ended_at, billable_minutes FROM time_entries WHERE case_id = ?1 ORDER BY started_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![case_id], |row| {
                Ok(TimeEntry {
                    id: row.get(0)?,
                    case_id: row.get(1)?,
                    started_at: row.get(2)?,
                    ended_at: row.get(3)?,
                    billable_minutes: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    })
}

#[tauri::command]
fn pause_timer(case_id: String, state: State<AppState>) -> Result<TimeEntry, String> {
    let entry_id = with_conn(&state, |conn| {
        conn.query_row(
            "SELECT entry_id FROM active_timers WHERE case_id = ?1",
            params![case_id],
            |row| row.get::<_, String>(0),
        )
        .map_err(|_| "no active timer for case".to_string())
    })?;
    stop_timer(entry_id, state)
}

#[tauri::command]
fn resume_timer(case_id: String, state: State<AppState>) -> Result<TimeEntry, String> {
    start_timer(case_id, state)
}

#[tauri::command]
fn calculate_billing_amount(case_id: String, state: State<AppState>) -> Result<BillingSummary, String> {
    with_conn(&state, |conn| {
        let total: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(billable_minutes), 0) FROM time_entries WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        let (billing_type, pay_rate): (String, f64) = conn
            .query_row(
                "SELECT billing_type, COALESCE(pay_rate, 150.0) FROM case_billing_config WHERE case_id = ?1",
                params![case_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap_or(("pay_rate".to_string(), 150.0));
        let amount = if billing_type == "fixed_price" {
            pay_rate
        } else {
            (total as f64 / 60.0) * pay_rate
        };
        Ok(BillingSummary {
            case_id,
            total_minutes: total,
            amount,
            billing_type,
        })
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

fn fts_search(
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
) -> Result<Vec<String>, String> {
    let hits = search_files(case_id.clone(), query.clone(), limit, state.clone())?;
    let mut ids: Vec<String> = hits
        .into_iter()
        .map(|h| format!("{}:{}", h.entity_type, h.id))
        .collect();
    let note_hits = search_notes(case_id, query, limit, state)?;
    ids.extend(note_hits.into_iter().map(|h| format!("{}:{}", h.entity_type, h.id)));
    Ok(ids)
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

fn build_report_body(case_id: &str, conn: &rusqlite::Connection, kind: &str) -> Result<String, String> {
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
    let total_minutes: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(billable_minutes), 0) FROM time_entries WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let pay_rate: f64 = conn
        .query_row(
            "SELECT COALESCE(pay_rate, 150.0) FROM case_billing_config WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .unwrap_or(150.0);
    let amount = (total_minutes as f64 / 60.0) * pay_rate;

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
            "# Financial Package — {case_name}\n\nTotal billable minutes: {total_minutes}\nHourly rate: ${pay_rate:.2}\nComputed amount: ${amount:.2}\nFiles in scope: {file_count}\n",
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
    Ok(ReportExport {
        report_type,
        file_path: file_path.to_string_lossy().to_string(),
        generated_at: now_iso(),
    })
}

#[tauri::command]
fn generate_case_report(case_id: String, state: State<AppState>) -> Result<String, String> {
    with_conn(&state, |conn| build_report_body(&case_id, conn, "narrative"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
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
            start_timer,
            stop_timer,
            pause_timer,
            resume_timer,
            get_time_entries,
            calculate_billing_amount,
            get_column_config_db,
            save_column_config_db,
            get_mapping_config_db,
            save_mapping_config_db,
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
            generate_case_report,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod parity_unit {
    use super::*;
    use crate::database::Database;
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
