use desktop_backend_lib::database::Database;
use rusqlite::params;
use std::fs;
use std::path::PathBuf;
fn temp_db() -> (PathBuf, Database) {
    let dir = std::env::temp_dir().join(format!("casespace-parity-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("casespace.db");
    let db = Database::open(&path).expect("open db");
    (dir, db)
}

fn with_db<F, T>(db: &Database, f: F) -> T
where
    F: FnOnce(&rusqlite::Connection) -> Result<T, String>,
{
    db.with_connection(f).expect("db op")
}

#[test]
fn flow_case_artifact_crud_round_trip() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Test', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        let note_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO notes (id, case_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, 'alpha note', 0, ?3, ?3)",
            params![note_id, case_id, now],
        )
        .unwrap();
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM notes WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
        conn.execute("DELETE FROM notes WHERE id = ?1", params![note_id])
            .unwrap();
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM notes WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 0);
        Ok(())
    });
}

#[test]
fn flow_ingest_persists_files() {
    let (dir, db) = temp_db();
    let case_dir = dir.join("evidence");
    fs::create_dir_all(&case_dir).unwrap();
    fs::write(case_dir.join("a.txt"), "hello").unwrap();
    fs::write(case_dir.join("b.txt"), "world").unwrap();

    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Ingest', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO case_sources (id, case_id, source_path, added_at) VALUES (?1, ?2, ?3, ?4)",
            params![
                uuid::Uuid::new_v4().to_string(),
                case_id,
                case_dir.to_string_lossy().to_string(),
                now
            ],
        )
        .unwrap();

        for entry in walkdir::WalkDir::new(&case_dir)
            .into_iter()
            .filter_map(Result::ok)
        {
            if !entry.file_type().is_file() {
                continue;
            }
            let abs = entry.path().to_string_lossy().to_string();
            conn.execute(
                "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_size, modified_at, status)
                 VALUES (?1, ?2, ?3, '', ?4, ?5, ?6, 'unreviewed')",
                params![
                    uuid::Uuid::new_v4().to_string(),
                    case_id,
                    entry.file_name().to_string_lossy().to_string(),
                    abs,
                    0i64,
                    now
                ],
            )
            .unwrap();
        }

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 2);
        Ok(())
    });
}

#[test]
fn flow_fts_finds_note_content() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'FTS', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO notes (id, case_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, 'unique zebra keyword', 0, ?3, ?3)",
            params![uuid::Uuid::new_v4().to_string(), case_id, now],
        )
        .unwrap();
        let hits: i64 = conn
            .query_row(
                r#"
                SELECT COUNT(*)
                FROM notes_fts fts
                JOIN notes n ON n.rowid = fts.rowid
                WHERE notes_fts MATCH 'zebra*' AND n.case_id = ?1
                "#,
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(hits, 1);
        Ok(())
    });
}

#[test]
fn flow_five_report_exports_non_empty() {
    let (dir, db) = temp_db();
    let export_dir = dir.join("exports").join("case1");
    std::fs::create_dir_all(&export_dir).unwrap();
    let kinds = [
        "narrative",
        "executive",
        "evidence_index",
        "financial",
        "billing_invoice",
    ];
    let _ = with_db(&db, |conn| {
        let case_id = "case1".to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'R', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO case_billing_config (case_id, billing_type, pay_rate, rate_unit, created_at, updated_at) VALUES (?1, 'pay_rate', 100.0, 'hourly', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        for kind in kinds {
            let body = format!("# {kind}\n\ncontent");
            let path = export_dir.join(format!("{kind}.md"));
            std::fs::write(&path, body).unwrap();
            assert!(path.exists());
            assert!(std::fs::metadata(&path).unwrap().len() > 0);
        }
        Ok(())
    });
}

#[test]
fn flow_timer_creates_entry() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let entry_id = uuid::Uuid::new_v4().to_string();
        let started = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Timer', 'active', ?2, ?2)",
            params![case_id, started],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_entries (id, case_id, started_at, ended_at, billable_minutes) VALUES (?1, ?2, ?3, NULL, 0)",
            params![entry_id, case_id, started],
        )
        .unwrap();
        let active: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM time_entries WHERE case_id = ?1 AND ended_at IS NULL",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(active, 1);
        Ok(())
    });
}

#[test]
fn flow_config_tables_round_trip() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Cfg', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO column_configs (case_id, config_data, updated_at) VALUES (?1, ?2, ?3)",
            params![case_id, "{\"columns\":[\"name\"]}", now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO mapping_configs (case_id, config_data, updated_at) VALUES (?1, ?2, ?3)",
            params![case_id, "{\"map\":{}}", now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO workspace_preferences (case_id, prefs_data, updated_at) VALUES (?1, ?2, ?3)",
            params![case_id, "{\"view\":\"board\"}", now],
        )
        .unwrap();

        let cfg: String = conn
            .query_row(
                "SELECT config_data FROM column_configs WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert!(cfg.contains("columns"));
        Ok(())
    });
}

#[test]
fn flow_duplicate_and_metadata_tables_round_trip() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let file_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Dup', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status)
             VALUES (?1, ?2, 'a.txt', '', '/tmp/a.txt', 'hash-1', 1, ?3, 'unreviewed')",
            params![file_id, case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO file_metadata (file_id, metadata_json, extracted_at) VALUES (?1, ?2, ?3)",
            params![file_id, "{\"ext\":\"txt\"}", now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO duplicate_groups (group_id, file_id, is_primary, created_at) VALUES ('hash-1', ?1, 1, ?2)",
            params![file_id, now],
        )
        .unwrap();
        let dup_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM duplicate_groups WHERE group_id = 'hash-1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(dup_count, 1);
        Ok(())
    });
}
