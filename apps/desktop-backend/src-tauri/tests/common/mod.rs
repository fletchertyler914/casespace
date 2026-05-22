use desktop_backend_lib::database::Database;
use rusqlite::{params, Connection};
use std::fs;
use std::path::{Path, PathBuf};

pub fn temp_db() -> (PathBuf, Database) {
    let dir = std::env::temp_dir().join(format!("casespace-parity-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("casespace.db");
    let db = Database::open(&path).expect("open db");
    (dir, db)
}

pub fn with_conn_mut<F, T>(db: &Database, f: F) -> T
where
    F: FnOnce(&mut Connection) -> Result<T, String>,
{
    db.with_connection_mut(f).expect("db op")
}

pub fn with_conn<F, T>(db: &Database, f: F) -> T
where
    F: FnOnce(&Connection) -> Result<T, String>,
{
    db.with_connection(f).expect("db op")
}

pub fn mini_case_fixture_dir() -> PathBuf {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../fixtures/mini-case");
    path.canonicalize().unwrap_or(path)
}

pub fn seed_case_with_source(conn: &Connection, case_id: &str, source_path: &str) {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Parity', 'active', ?2, ?2)",
        params![case_id, now],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO case_sources (id, case_id, source_path, added_at) VALUES (?1, ?2, ?3, ?4)",
        params![
            uuid::Uuid::new_v4().to_string(),
            case_id,
            source_path,
            now
        ],
    )
    .unwrap();
}

pub fn file_count(conn: &Connection, case_id: &str) -> i64 {
    conn.query_row(
        "SELECT COUNT(*) FROM files WHERE case_id = ?1 AND deleted_at IS NULL",
        params![case_id],
        |row| row.get(0),
    )
    .unwrap()
}

pub fn duplicate_group_count(conn: &Connection, case_id: &str) -> i64 {
    conn.query_row(
        "SELECT COUNT(DISTINCT group_id) FROM duplicate_groups dg
         JOIN files f ON f.id = dg.file_id
         WHERE f.case_id = ?1",
        params![case_id],
        |row| row.get(0),
    )
    .unwrap()
}

pub fn write_identical_pair(dir: &Path) -> String {
    fs::create_dir_all(dir).unwrap();
    let content = b"identical-hash-content";
    fs::write(dir.join("copy-a.txt"), content).unwrap();
    fs::write(dir.join("copy-b.txt"), content).unwrap();
    dir.to_string_lossy().to_string()
}
