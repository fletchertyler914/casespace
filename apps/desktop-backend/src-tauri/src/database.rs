use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

const SCHEMA_VERSION: i32 = 1;

const MIGRATION_V1: &str = r#"
CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS case_sources (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    source_path TEXT NOT NULL,
    added_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    UNIQUE(case_id, source_path)
);

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    folder_path TEXT,
    absolute_path TEXT NOT NULL,
    file_hash TEXT,
    file_size INTEGER,
    modified_at TEXT,
    status TEXT DEFAULT 'unreviewed',
    deleted_at TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    UNIQUE(case_id, absolute_path)
);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    file_id TEXT,
    content TEXT NOT NULL,
    pinned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    description TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    source_file_id TEXT,
    event_type TEXT DEFAULT 'manual',
    created_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    billable_minutes INTEGER DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS active_timers (
    case_id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS case_billing_config (
    case_id TEXT PRIMARY KEY,
    billing_type TEXT NOT NULL DEFAULT 'pay_rate',
    fixed_price REAL,
    pay_rate REAL DEFAULT 150.0,
    rate_unit TEXT DEFAULT 'hourly',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_metadata (
    file_id TEXT PRIMARY KEY,
    metadata_json TEXT NOT NULL,
    extracted_at TEXT NOT NULL,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS duplicate_groups (
    group_id TEXT NOT NULL,
    file_id TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    PRIMARY KEY (group_id, file_id),
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS column_configs (
    case_id TEXT PRIMARY KEY,
    config_data TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mapping_configs (
    case_id TEXT PRIMARY KEY,
    config_data TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_preferences (
    case_id TEXT PRIMARY KEY,
    prefs_data TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_case_id ON files(case_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_notes_case_id ON notes(case_id);
CREATE INDEX IF NOT EXISTS idx_findings_case_id ON findings(case_id);
CREATE INDEX IF NOT EXISTS idx_timeline_case_id ON timeline_events(case_id);
CREATE INDEX IF NOT EXISTS idx_files_case_hash ON files(case_id, file_hash);

CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
    file_name,
    folder_path,
    content='files',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    content,
    content='notes',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

CREATE VIRTUAL TABLE IF NOT EXISTS findings_fts USING fts5(
    title,
    description,
    content='findings',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

CREATE VIRTUAL TABLE IF NOT EXISTS timeline_events_fts USING fts5(
    description,
    content='timeline_events',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS files_fts_insert AFTER INSERT ON files BEGIN
    INSERT INTO files_fts(rowid, file_name, folder_path) VALUES (new.rowid, new.file_name, new.folder_path);
END;
CREATE TRIGGER IF NOT EXISTS files_fts_delete AFTER DELETE ON files BEGIN
    INSERT INTO files_fts(files_fts, rowid, file_name, folder_path) VALUES('delete', old.rowid, old.file_name, old.folder_path);
END;
CREATE TRIGGER IF NOT EXISTS files_fts_update AFTER UPDATE ON files BEGIN
    INSERT INTO files_fts(files_fts, rowid, file_name, folder_path) VALUES('delete', old.rowid, old.file_name, old.folder_path);
    INSERT INTO files_fts(rowid, file_name, folder_path) VALUES (new.rowid, new.file_name, new.folder_path);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, content) VALUES (new.rowid, new.content);
END;
CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, content) VALUES('delete', old.rowid, old.content);
END;
CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, content) VALUES('delete', old.rowid, old.content);
    INSERT INTO notes_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER IF NOT EXISTS findings_fts_insert AFTER INSERT ON findings BEGIN
    INSERT INTO findings_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;
CREATE TRIGGER IF NOT EXISTS findings_fts_delete AFTER DELETE ON findings BEGIN
    INSERT INTO findings_fts(findings_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
END;
CREATE TRIGGER IF NOT EXISTS findings_fts_update AFTER UPDATE ON findings BEGIN
    INSERT INTO findings_fts(findings_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
    INSERT INTO findings_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS timeline_events_fts_insert AFTER INSERT ON timeline_events BEGIN
    INSERT INTO timeline_events_fts(rowid, description) VALUES (new.rowid, new.description);
END;
CREATE TRIGGER IF NOT EXISTS timeline_events_fts_delete AFTER DELETE ON timeline_events BEGIN
    INSERT INTO timeline_events_fts(timeline_events_fts, rowid, description) VALUES('delete', old.rowid, old.description);
END;
CREATE TRIGGER IF NOT EXISTS timeline_events_fts_update AFTER UPDATE ON timeline_events BEGIN
    INSERT INTO timeline_events_fts(timeline_events_fts, rowid, description) VALUES('delete', old.rowid, old.description);
    INSERT INTO timeline_events_fts(rowid, description) VALUES (new.rowid, new.description);
END;
"#;

pub struct Database {
    pub(crate) conn: Mutex<Connection>,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("failed to create db parent dir: {e}"))?;
        }
        let conn = Connection::open(path).map_err(|e| format!("open database failed: {e}"))?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .map_err(|e| format!("pragma failed: {e}"))?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "db lock poisoned")?;
        conn.execute_batch(MIGRATION_V1)
            .map_err(|e| format!("migration failed: {e}"))?;
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM _migrations WHERE version = ?1",
                params![SCHEMA_VERSION],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if count == 0 {
            let now = chrono::Utc::now().to_rfc3339();
            conn.execute(
                "INSERT INTO _migrations (version, applied_at) VALUES (?1, ?2)",
                params![SCHEMA_VERSION, now],
            )
            .map_err(|e| format!("record migration failed: {e}"))?;
        }
        Ok(())
    }

    pub fn import_json_store(&self, json_path: &Path) -> Result<bool, String> {
        let contents = match std::fs::read_to_string(json_path) {
            Ok(c) => c,
            Err(_) => return Ok(false),
        };
        let store: LegacyStore =
            serde_json::from_str(&contents).map_err(|e| format!("parse legacy store: {e}"))?;
        let conn = self.conn.lock().map_err(|_| "db lock poisoned")?;
        let case_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))
            .map_err(|e| format!("count cases: {e}"))?;
        if case_count > 0 {
            return Ok(false);
        }

        let tx = conn
            .unchecked_transaction()
            .map_err(|e| format!("begin tx: {e}"))?;
        for case in store.cases.values() {
            tx.execute(
                "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    case.id,
                    case.name,
                    case.status,
                    case.created_at,
                    case.updated_at
                ],
            )
            .map_err(|e| format!("import case: {e}"))?;
            for source in &case.source_paths {
                let source_id = uuid::Uuid::new_v4().to_string();
                tx.execute(
                    "INSERT INTO case_sources (id, case_id, source_path, added_at) VALUES (?1, ?2, ?3, ?4)",
                    params![source_id, case.id, source, case.created_at],
                )
                .map_err(|e| format!("import source: {e}"))?;
            }
        }
        for note in &store.notes {
            let updated = note.created_at.clone();
            tx.execute(
                "INSERT INTO notes (id, case_id, file_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, NULL, ?3, 0, ?4, ?5)",
                params![note.id, note.case_id, note.content, note.created_at, updated],
            )
            .map_err(|e| format!("import note: {e}"))?;
        }
        for finding in &store.findings {
            tx.execute(
                "INSERT INTO findings (id, case_id, title, description, severity, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 'medium', ?5, ?5)",
                params![
                    finding.id,
                    finding.case_id,
                    finding.title,
                    finding.description,
                    finding.created_at
                ],
            )
            .map_err(|e| format!("import finding: {e}"))?;
        }
        for event in &store.timeline_events {
            tx.execute(
                "INSERT INTO timeline_events (id, case_id, description, occurred_at, source_file_id, event_type, created_at) VALUES (?1, ?2, ?3, ?4, NULL, 'manual', ?5)",
                params![
                    event.id,
                    event.case_id,
                    event.description,
                    event.occurred_at,
                    event.occurred_at
                ],
            )
            .map_err(|e| format!("import timeline: {e}"))?;
        }
        for entry in &store.time_entries {
            tx.execute(
                "INSERT INTO time_entries (id, case_id, started_at, ended_at, billable_minutes) VALUES (?1, ?2, ?3, ?4, 0)",
                params![entry.id, entry.case_id, entry.started_at, entry.ended_at],
            )
            .map_err(|e| format!("import time entry: {e}"))?;
        }
        for item in &store.inventory_items {
            tx.execute(
                "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6, ?7, 'unreviewed', NULL)",
                params![
                    item.id,
                    item.case_id,
                    item.file_name,
                    "",
                    item.file_path,
                    item.size_bytes,
                    item.modified_at
                ],
            )
            .map_err(|e| format!("import file: {e}"))?;
        }
        tx.commit().map_err(|e| format!("commit import: {e}"))?;
        Ok(true)
    }

    pub fn with_connection<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> Result<T, String>,
    {
        let conn = self.conn.lock().map_err(|_| "db lock poisoned")?;
        f(&conn)
    }

    pub fn list_case_roots(&self, case_id: Option<&str>) -> Result<Vec<String>, String> {
        let conn = self.conn.lock().map_err(|_| "db lock poisoned")?;
        if let Some(id) = case_id {
            let mut stmt = conn
                .prepare("SELECT source_path FROM case_sources WHERE case_id = ?1")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map(params![id], |row| row.get::<_, String>(0))
                .map_err(|e| e.to_string())?;
            return Ok(rows.filter_map(Result::ok).collect());
        }
        let mut stmt = conn
            .prepare("SELECT DISTINCT source_path FROM case_sources")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        Ok(rows.filter_map(Result::ok).collect())
    }
}

pub fn db_path(app_data: &Path) -> PathBuf {
    let mut path = app_data.to_path_buf();
    path.push("casespace.db");
    path
}

pub fn legacy_json_path(app_data: &Path) -> PathBuf {
    let mut path = app_data.to_path_buf();
    path.push("casespace-v2-store.json");
    path
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
struct LegacyStore {
    cases: std::collections::HashMap<String, LegacyCase>,
    notes: Vec<LegacyNote>,
    findings: Vec<LegacyFinding>,
    timeline_events: Vec<LegacyTimeline>,
    time_entries: Vec<LegacyTimeEntry>,
    inventory_items: Vec<LegacyInventory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyCase {
    id: String,
    name: String,
    status: String,
    source_paths: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyNote {
    id: String,
    case_id: String,
    content: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyFinding {
    id: String,
    case_id: String,
    title: String,
    description: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyTimeline {
    id: String,
    case_id: String,
    description: String,
    occurred_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyTimeEntry {
    id: String,
    case_id: String,
    started_at: String,
    ended_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyInventory {
    id: String,
    case_id: String,
    file_name: String,
    file_path: String,
    size_bytes: u64,
    modified_at: String,
}
