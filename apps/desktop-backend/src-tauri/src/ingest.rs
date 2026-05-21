//! Case source ingestion: folders, individual files, incremental sync, dedup groups, orphan cleanup.

use crate::path;
use rusqlite::{params, Connection, OptionalExtension};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestResult {
    pub files_inserted: u64,
    pub files_updated: u64,
    pub files_skipped: u64,
    pub files_deleted: u64,
    pub files_protected: u64,
    pub errors: Vec<String>,
}

impl IngestResult {
    pub fn merge(&mut self, mut other: IngestResult) {
        self.files_inserted += other.files_inserted;
        self.files_updated += other.files_updated;
        self.files_skipped += other.files_skipped;
        self.files_deleted += other.files_deleted;
        self.files_protected += other.files_protected;
        self.errors.append(&mut other.errors);
    }
}

#[derive(Debug, Clone)]
pub struct ScannedFile {
    pub absolute_path: String,
    pub file_name: String,
    pub folder_path: Option<String>,
    pub file_size: u64,
    pub modified_at: String,
    pub file_hash: String,
}

pub fn hash_file(path: &Path) -> Option<String> {
    let data = fs::read(path).ok()?;
    Some(format!("{:x}", Sha256::digest(data)))
}

fn modified_iso(metadata: &fs::Metadata) -> String {
    metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .and_then(|d| {
            chrono::DateTime::from_timestamp(d.as_secs() as i64, 0)
                .map(|dt| dt.to_rfc3339())
        })
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339())
}

/// Parent directory of `file`, relative to ingested source `root`.
pub fn relative_folder_path(file: &Path, root: &Path) -> Option<String> {
    let parent = file.parent()?;
    let rel = parent.strip_prefix(root).ok()?;
    if rel.as_os_str().is_empty() {
        return None;
    }
    Some(rel.to_string_lossy().replace('\\', "/"))
}

/// Scan a case source path (directory or single file).
pub fn scan_source(source: &Path, limit: usize) -> Result<Vec<ScannedFile>, String> {
    if !source.exists() {
        return Err(format!("source does not exist: {}", source.display()));
    }
    let meta = fs::metadata(source).map_err(|e| e.to_string())?;
    if meta.is_file() {
        let root = source.parent().ok_or("file source has no parent directory")?;
        return Ok(vec![scan_one_file(source, root)?]);
    }
    if !meta.is_dir() {
        return Err("source is not a file or directory".into());
    }
    let mut out = Vec::new();
    for entry in WalkDir::new(source).into_iter().filter_map(Result::ok).take(limit) {
        let Ok(entry_meta) = entry.metadata() else {
            continue;
        };
        if !entry_meta.is_file() {
            continue;
        }
        if let Ok(scanned) = scan_one_file(entry.path(), source) {
            out.push(scanned);
        }
    }
    Ok(out)
}

fn scan_one_file(path: &Path, root: &Path) -> Result<ScannedFile, String> {
    let meta = fs::metadata(path).map_err(|e| e.to_string())?;
    if !meta.is_file() {
        return Err("not a file".into());
    }
    Ok(ScannedFile {
        absolute_path: path.to_string_lossy().to_string(),
        file_name: path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default(),
        folder_path: relative_folder_path(path, root),
        file_size: meta.len(),
        modified_at: modified_iso(&meta),
        file_hash: hash_file(path).unwrap_or_default(),
    })
}

fn source_scope_prefix(source: &str) -> String {
    let norm = source.replace('\\', "/").trim_end_matches('/').to_string();
    if Path::new(source).is_file() {
        norm
    } else {
        format!("{norm}/")
    }
}

struct ExistingRow {
    id: String,
    file_hash: Option<String>,
    file_size: i64,
    modified_at: String,
    #[allow(dead_code)]
    status: String,
    deleted_at: Option<String>,
}

fn load_existing(
    conn: &Connection,
    case_id: &str,
    absolute_path: &str,
) -> Result<Option<ExistingRow>, String> {
    conn.query_row(
        "SELECT id, file_hash, file_size, modified_at, status, deleted_at
         FROM files WHERE case_id = ?1 AND absolute_path = ?2",
        params![case_id, absolute_path],
        |row| {
            Ok(ExistingRow {
                id: row.get(0)?,
                file_hash: row.get(1)?,
                file_size: row.get(2)?,
                modified_at: row.get(3)?,
                status: row.get(4)?,
                deleted_at: row.get(5)?,
            })
        },
    )
    .optional()
    .map_err(|e| e.to_string())
}

fn find_rename_target(
    conn: &Connection,
    case_id: &str,
    source_path: &str,
    hash: &str,
    new_absolute: &str,
) -> Result<Option<String>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, absolute_path FROM files
             WHERE case_id = ?1 AND file_hash = ?2 AND absolute_path != ?3
               AND source_path = ?4 AND deleted_at IS NULL",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![case_id, hash, new_absolute, source_path], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    for row in rows.flatten() {
        if !Path::new(&row.1).exists() {
            return Ok(Some(row.0));
        }
    }
    Ok(None)
}

fn upsert_file(
    conn: &Connection,
    case_id: &str,
    source_path: &str,
    scanned: &ScannedFile,
    incremental: bool,
) -> Result<&'static str, String> {
    if let Some(existing) = load_existing(conn, case_id, &scanned.absolute_path)? {
        if existing.deleted_at.is_some() {
            return Ok("skip");
        }
        let size = scanned.file_size as i64;
        if incremental
            && existing.file_size == size
            && existing.modified_at == scanned.modified_at
            && existing.file_hash.as_deref() == Some(scanned.file_hash.as_str())
            && !scanned.file_hash.is_empty()
        {
            return Ok("skip");
        }
        let hash_opt = if scanned.file_hash.is_empty() {
            None
        } else {
            Some(scanned.file_hash.as_str())
        };
        conn.execute(
            "UPDATE files SET file_name = ?1, folder_path = ?2, file_hash = ?3,
             file_size = ?4, modified_at = ?5, source_path = ?6, deleted_at = NULL
             WHERE id = ?7",
            params![
                scanned.file_name,
                scanned.folder_path,
                hash_opt,
                size,
                scanned.modified_at,
                source_path,
                existing.id
            ],
        )
        .map_err(|e| e.to_string())?;
        return Ok("update");
    }

    if !scanned.file_hash.is_empty() {
        if let Some(rename_id) =
            find_rename_target(conn, case_id, source_path, &scanned.file_hash, &scanned.absolute_path)?
        {
            let hash_opt = Some(scanned.file_hash.as_str());
            conn.execute(
                "UPDATE files SET file_name = ?1, folder_path = ?2, absolute_path = ?3,
                 file_hash = ?4, file_size = ?5, modified_at = ?6, source_path = ?7, deleted_at = NULL
                 WHERE id = ?8",
                params![
                    scanned.file_name,
                    scanned.folder_path,
                    scanned.absolute_path,
                    hash_opt,
                    scanned.file_size as i64,
                    scanned.modified_at,
                    source_path,
                    rename_id
                ],
            )
            .map_err(|e| e.to_string())?;
            return Ok("update");
        }
    }

    let id = Uuid::new_v4().to_string();
    let hash_opt = if scanned.file_hash.is_empty() {
        None
    } else {
        Some(scanned.file_hash.as_str())
    };
    conn.execute(
        "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash,
         file_size, modified_at, status, deleted_at, source_path)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'unreviewed', NULL, ?9)",
        params![
            id,
            case_id,
            scanned.file_name,
            scanned.folder_path,
            scanned.absolute_path,
            hash_opt,
            scanned.file_size as i64,
            scanned.modified_at,
            source_path
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok("insert")
}

pub fn rebuild_duplicate_groups(conn: &Connection, case_id: &str) -> Result<u64, String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "DELETE FROM duplicate_groups WHERE group_id IN (
            SELECT file_hash FROM files WHERE case_id = ?1 AND file_hash IS NOT NULL AND file_hash != ''
        )",
        params![case_id],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT file_hash, id FROM files
             WHERE case_id = ?1 AND deleted_at IS NULL AND file_hash IS NOT NULL AND file_hash != ''
             ORDER BY file_hash, id",
        )
        .map_err(|e| e.to_string())?;
    let rows: Vec<(String, String)> = stmt
        .query_map(params![case_id], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let mut groups: std::collections::BTreeMap<String, Vec<String>> = std::collections::BTreeMap::new();
    for (hash, id) in rows {
        groups.entry(hash).or_default().push(id);
    }

    let mut created = 0u64;
    for (hash, file_ids) in groups {
        if file_ids.len() < 2 {
            continue;
        }
        for (i, file_id) in file_ids.iter().enumerate() {
            conn.execute(
                "INSERT INTO duplicate_groups (group_id, file_id, is_primary, created_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![hash, file_id, if i == 0 { 1 } else { 0 }, now],
            )
            .map_err(|e| e.to_string())?;
            created += 1;
        }
    }
    Ok(created)
}

fn file_has_user_data(conn: &Connection, case_id: &str, file_id: &str, status: &str) -> Result<bool, String> {
    if status != "unreviewed" {
        return Ok(true);
    }
    let note_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM notes WHERE case_id = ?1 AND file_id = ?2",
            params![case_id, file_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(note_count > 0)
}

pub fn cleanup_orphaned_files(
    conn: &Connection,
    case_id: &str,
    source_path: &str,
    scanned_paths: &HashSet<String>,
) -> Result<(u64, u64), String> {
    let prefix = source_scope_prefix(source_path);
    let is_file_source = Path::new(source_path).is_file();

    let mut stmt = conn
        .prepare(
            "SELECT id, absolute_path, status FROM files
             WHERE case_id = ?1 AND source_path = ?2 AND deleted_at IS NULL",
        )
        .map_err(|e| e.to_string())?;
    let rows: Vec<(String, String, String)> = stmt
        .query_map(params![case_id, source_path], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let now = chrono::Utc::now().to_rfc3339();
    let mut deleted = 0u64;
    let mut protected = 0u64;

    for (id, abs, status) in rows {
        let in_scope = if is_file_source {
            abs == source_path
        } else {
            abs.replace('\\', "/").starts_with(&prefix)
        };
        if !in_scope {
            continue;
        }
        if scanned_paths.contains(&abs) {
            continue;
        }
        if file_has_user_data(conn, case_id, &id, &status)? {
            protected += 1;
            continue;
        }
        conn.execute(
            "UPDATE files SET deleted_at = ?1 WHERE id = ?2",
            params![now, id],
        )
        .map_err(|e| e.to_string())?;
        deleted += 1;
    }
    Ok((deleted, protected))
}

pub fn ingest_source(
    conn: &mut Connection,
    case_id: &str,
    source_path: &str,
    incremental: bool,
    limit: usize,
) -> Result<IngestResult, String> {
    if !path::is_path_string_safe(source_path) {
        return Err("unsafe source path".into());
    }
    let source = Path::new(source_path);
    let scan_root = if source.is_file() {
        source.parent().ok_or("file source has no parent")?
    } else {
        source
    };

    let mut result = IngestResult {
        files_inserted: 0,
        files_updated: 0,
        files_skipped: 0,
        files_deleted: 0,
        files_protected: 0,
        errors: Vec::new(),
    };

    let scanned = match scan_source(source, limit) {
        Ok(s) => s,
        Err(e) => {
            result.errors.push(e);
            return Ok(result);
        }
    };

    let scanned_set: HashSet<String> = scanned.iter().map(|f| f.absolute_path.clone()).collect();

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    for file in &scanned {
        match upsert_file(&tx, case_id, source_path, file, incremental) {
            Ok("insert") => result.files_inserted += 1,
            Ok("update") => result.files_updated += 1,
            Ok("skip") => result.files_skipped += 1,
            Ok(_) => {}
            Err(e) => result.errors.push(format!("{}: {e}", file.absolute_path)),
        }
    }
    if let Err(e) = rebuild_duplicate_groups(&tx, case_id) {
        result.errors.push(format!("duplicate groups: {e}"));
    }
    match cleanup_orphaned_files(&tx, case_id, source_path, &scanned_set) {
        Ok((d, p)) => {
            result.files_deleted += d;
            result.files_protected += p;
        }
        Err(e) => result.errors.push(format!("cleanup: {e}")),
    }
    tx.commit().map_err(|e| e.to_string())?;

    let _ = scan_root;
    Ok(result)
}

pub fn ingest_all_sources(
    conn: &mut Connection,
    case_id: &str,
    sources: &[String],
    incremental: bool,
    per_source_limit: usize,
) -> Result<IngestResult, String> {
    let mut total = IngestResult {
        files_inserted: 0,
        files_updated: 0,
        files_skipped: 0,
        files_deleted: 0,
        files_protected: 0,
        errors: Vec::new(),
    };
    for source in sources {
        match ingest_source(conn, case_id, source, incremental, per_source_limit) {
            Ok(r) => total.merge(r),
            Err(e) => total.errors.push(format!("{source}: {e}")),
        }
    }
    conn.execute(
        "UPDATE cases SET updated_at = ?1 WHERE id = ?2",
        params![chrono::Utc::now().to_rfc3339(), case_id],
    )
    .ok();
    Ok(total)
}
