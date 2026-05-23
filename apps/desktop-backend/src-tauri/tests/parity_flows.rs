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
fn flow_v6_schema_repair_when_migration_row_exists_without_entry_date() {
    let dir = std::env::temp_dir().join(format!("casespace-parity-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("casespace.db");

    let db = Database::open(&path).expect("initial open");
    let (case_id, entry_id, seg_id): (String, String, String) = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let entry_id = uuid::Uuid::new_v4().to_string();
        let seg_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Repair', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_entries (id, case_id, entry_date, total_seconds, created_at, updated_at)
             VALUES (?1, ?2, ?3, 60, ?4, ?4)",
            params![entry_id, case_id, format!("{}T00:00:00+00:00", &now[..10]), now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_segments (id, entry_id, started_at, ended_at, duration_seconds, discount_percent)
             VALUES (?1, ?2, ?3, ?3, 60, 0)",
            params![seg_id, entry_id, now],
        )
        .unwrap();
        Ok((case_id, entry_id, seg_id))
    });
    let _ = with_db(&db, |conn| {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute_batch(
            r#"
            PRAGMA foreign_keys=OFF;
            DROP TABLE time_entries;
            CREATE TABLE time_entries (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                billable_minutes INTEGER DEFAULT 0,
                summary TEXT
            );
            "#,
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_entries (id, case_id, started_at, ended_at, billable_minutes)
             VALUES (?1, ?2, ?3, NULL, 1)",
            params![entry_id, case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO _migrations (version, applied_at) VALUES (6, ?1)",
            params![now],
        )
        .unwrap();
        Ok(())
    });
    drop(db);

    let db2 = Database::open(&path).expect("repair open");
    let _ = with_db(&db2, |conn| {
        let cols: Vec<String> = conn
            .prepare("PRAGMA table_info(time_entries)")
            .unwrap()
            .query_map([], |row| row.get(1))
            .unwrap()
            .filter_map(Result::ok)
            .collect();
        assert!(cols.iter().any(|c| c == "entry_date"));
        let seg_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM time_segments WHERE id = ?1",
                params![seg_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(seg_count, 1, "segments should survive v6 repair");
        Ok(())
    });
}

#[test]
fn flow_day_based_time_entry_schema() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let entry_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let day = format!(
            "{}T00:00:00+00:00",
            now.chars().take(10).collect::<String>()
        );
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Timer', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_entries (id, case_id, entry_date, total_seconds, summary, created_at, updated_at)
             VALUES (?1, ?2, ?3, 3600, 'work', ?4, ?4)",
            params![entry_id, case_id, day, now],
        )
        .unwrap();
        let total: i64 = conn
            .query_row(
                "SELECT total_seconds FROM time_entries WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(total, 3600);
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

#[test]
fn flow_search_all_returns_structured_hits() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        use desktop_backend_lib::{fts_search, SearchHit};

        let case_id = uuid::Uuid::new_v4().to_string();
        let file_id = uuid::Uuid::new_v4().to_string();
        let note_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Search', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status)
             VALUES (?1, ?2, 'quasar-invoice.pdf', 'docs', '/tmp/quasar-invoice.pdf', 'hash-q', 1, ?3, 'unreviewed')",
            params![file_id, case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO notes (id, case_id, file_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, NULL, 'quasar meeting notes', 0, ?3, ?3)",
            params![note_id, case_id, now],
        )
        .unwrap();

        let hits: Vec<SearchHit> = fts_search(conn, &case_id, "quasar", 10).unwrap();
        assert!(!hits.is_empty(), "expected at least one hit");

        let file_hit = hits
            .iter()
            .find(|h| h.entity_type == "file")
            .expect("file hit");
        assert_eq!(file_hit.id, file_id);
        assert_eq!(file_hit.title, "quasar-invoice.pdf");
        assert_eq!(file_hit.snippet, "docs");

        let note_hit = hits
            .iter()
            .find(|h| h.entity_type == "note")
            .expect("note hit");
        assert_eq!(note_hit.id, note_id);
        assert_eq!(note_hit.title, "Note");
        assert!(note_hit.snippet.contains("quasar"));

        Ok(())
    });
}

#[test]
fn flow_merge_duplicate_metadata_moves_notes() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        use desktop_backend_lib::merge_duplicate_metadata_conn;

        let case_id = uuid::Uuid::new_v4().to_string();
        let primary_id = uuid::Uuid::new_v4().to_string();
        let secondary_id = uuid::Uuid::new_v4().to_string();
        let note_id = uuid::Uuid::new_v4().to_string();
        let hash = "dup-hash-abc";
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Merge', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        for (fid, path) in [
            (primary_id.clone(), "/tmp/a.txt"),
            (secondary_id.clone(), "/tmp/b.txt"),
        ] {
            conn.execute(
                "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status)
                 VALUES (?1, ?2, 'dup.txt', '', ?3, ?4, 1, ?5, 'unreviewed')",
                params![fid, case_id, path, hash, now],
            )
            .unwrap();
        }
        conn.execute(
            "INSERT INTO notes (id, case_id, file_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, ?3, 'linked note', 0, ?4, ?4)",
            params![note_id, case_id, secondary_id, now],
        )
        .unwrap();

        merge_duplicate_metadata_conn(conn, &case_id, hash, &primary_id).unwrap();

        let linked_file: Option<String> = conn
            .query_row(
                "SELECT file_id FROM notes WHERE id = ?1",
                params![note_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(linked_file.as_deref(), Some(primary_id.as_str()));

        let secondary_deleted: Option<String> = conn
            .query_row(
                "SELECT deleted_at FROM files WHERE id = ?1",
                params![secondary_id],
                |row| row.get(0),
            )
            .unwrap();
        assert!(secondary_deleted.is_some());

        Ok(())
    });
}

#[test]
fn flow_file_note_counts_and_metadata_batch() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let file_id = uuid::Uuid::new_v4().to_string();
        let note_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Notes', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status)
             VALUES (?1, ?2, 'doc.pdf', '', '/tmp/doc.pdf', 'h', 1, ?3, 'unreviewed')",
            params![file_id, case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO notes (id, case_id, file_id, content, pinned, created_at, updated_at) VALUES (?1, ?2, ?3, 'note', 0, ?4, ?4)",
            params![note_id, case_id, file_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO file_metadata (file_id, metadata_json, extracted_at) VALUES (?1, '{\"title\":\"Doc\"}', ?2)",
            params![file_id, now],
        )
        .unwrap();

        let note_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM notes WHERE case_id = ?1 AND file_id = ?2",
                params![case_id, file_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(note_count, 1);

        let meta_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM files f INNER JOIN file_metadata fm ON f.id = fm.file_id WHERE f.case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(meta_count, 1);

        Ok(())
    });
}

#[test]
fn flow_wave_a_report_templates_compliance() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Wave A', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        let finding_id = uuid::Uuid::new_v4().to_string();
        let file_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_size, modified_at, status)
             VALUES (?1, ?2, 'evidence.pdf', '/', '/evidence.pdf', 100, ?3, 'reviewed')",
            params![file_id, case_id, now],
        )
        .unwrap();
        let linked = serde_json::json!([file_id]).to_string();
        conn.execute(
            "INSERT INTO findings (id, case_id, title, description, severity, linked_files, created_at, updated_at)
             VALUES (?1, ?2, 'Test finding', 'Description', 'high', ?3, ?4, ?4)",
            params![finding_id, case_id, linked, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO timeline_events (id, case_id, description, occurred_at, source_file_id, created_at)
             VALUES (?1, ?2, 'Event one', ?3, ?4, ?3)",
            params![uuid::Uuid::new_v4().to_string(), case_id, now, file_id],
        )
        .unwrap();

        for template in [
            "cfe-long",
            "cfe-short",
            "expert-witness-frcp26",
            "engagement-letter",
        ] {
            let doc = desktop_backend_lib::build_report_document(&case_id, template, &now, conn)
                .unwrap_or_else(|e| panic!("template {template}: {e}"));
            assert_eq!(doc.template_id, template);
            assert!(!doc.markdown.is_empty());
            assert!(doc.sections.iter().any(|s| !s.heading.is_empty()));
            let combined = doc.markdown.to_lowercase();
            assert!(!combined.contains("guilty of fraud"));
            if template == "expert-witness-frcp26" {
                assert!(doc.compliance.iter().any(|c| c.id == "FRCP-26-B"));
            }
        }
        Ok(())
    });
}

#[test]
fn flow_text_extract_round_trip() {
    let (dir, db) = temp_db();
    let fixture =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/text-extract/sample.txt");
    let case_file = dir.join("sample.txt");
    std::fs::copy(&fixture, &case_file).unwrap();

    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let file_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Extract', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_size, modified_at, status)
             VALUES (?1, ?2, 'sample.txt', '', ?3, 64, ?4, 'unreviewed')",
            params![file_id, case_id, case_file.to_string_lossy().to_string(), now],
        )
        .unwrap();

        let (text, extractor, ocr_used, err) =
            desktop_backend_lib::text_extract::extract_text_from_path(&case_file, None);
        assert!(err.is_none());
        assert!(!ocr_used);
        assert_eq!(extractor, "plain");
        assert!(text.contains("parity extract"));

        desktop_backend_lib::text_extract::persist_extract(
            conn, &file_id, &text, None, &extractor, ocr_used, None, &now,
        )
        .unwrap();

        let hits: i64 = conn
            .query_row(
                r#"
                SELECT COUNT(*)
                FROM file_text_fts fts
                JOIN file_text_extracts fte ON fte.rowid = fts.rowid
                WHERE file_text_fts MATCH 'parity*' AND fte.file_id = ?1
                "#,
                params![file_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(hits, 1);
        Ok(())
    });
}

#[test]
fn flow_image_ocr_runs_through_injected_provider() {
    // BYOK OCR: a deterministic in-process closure stands in for the cloud vision
    // call so this test covers the dispatch path without needing credentials.
    let dir = std::env::temp_dir().join(format!("casespace-ocr-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let image_path = dir.join("scan.png");
    fs::write(&image_path, b"\x89PNG\r\n\x1a\nfake-png-bytes").unwrap();

    let ocr: desktop_backend_lib::text_extract::OcrFn<'_> =
        Box::new(|b64: &str, mime: &str| {
            assert!(!b64.is_empty());
            assert_eq!(mime, "image/png");
            Ok("mocked vision-llm OCR output".to_string())
        });

    let (text, extractor, ocr_used, err) =
        desktop_backend_lib::text_extract::extract_text_from_path(&image_path, Some(&ocr));
    assert!(err.is_none(), "unexpected OCR error: {err:?}");
    assert!(ocr_used);
    assert_eq!(extractor, "vision-llm");
    assert!(text.contains("mocked vision-llm OCR output"));
}

#[test]
fn flow_image_ocr_without_provider_returns_actionable_error() {
    let dir = std::env::temp_dir().join(format!("casespace-ocr-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let image_path = dir.join("scan.jpg");
    fs::write(&image_path, b"jpeg-bytes").unwrap();

    let (text, extractor, ocr_used, err) =
        desktop_backend_lib::text_extract::extract_text_from_path(&image_path, None);
    assert!(text.is_empty());
    assert_eq!(extractor, "vision-llm");
    assert!(ocr_used);
    let message = err.expect("expected actionable error when no provider is configured");
    assert!(
        message.contains("AI provider"),
        "error should mention provider configuration: {message}"
    );
}

#[test]
fn flow_ai_finding_draft_lifecycle() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let file_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Drafts', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_size, modified_at, status)
             VALUES (?1, ?2, 'doc.pdf', '', '/doc.pdf', 1, ?3, 'unreviewed')",
            params![file_id, case_id, now],
        )
        .unwrap();

        let draft_id = desktop_backend_lib::ai_drafts::insert_finding_draft(
            conn,
            &case_id,
            "Test draft",
            "Evidence indicates a pattern consistent with duplicate billing.",
            "medium",
            &[file_id.clone()],
            &["p.1".to_string()],
            "test-model",
        )
        .unwrap();

        let finding_id =
            desktop_backend_lib::ai_drafts::approve_finding_draft(conn, &draft_id).unwrap();
        let status: String = conn
            .query_row(
                "SELECT status FROM ai_finding_drafts WHERE id = ?1",
                params![draft_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(status, "approved");

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM findings WHERE id = ?1",
                params![finding_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
        Ok(())
    });
}

#[test]
fn flow_corpus_aggregation_dedups() {
    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let file_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Merge', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_size, modified_at, status)
             VALUES (?1, ?2, 'doc.pdf', '', '/doc.pdf', 1, ?3, 'unreviewed')",
            params![file_id, case_id, now],
        )
        .unwrap();

        let d1 = desktop_backend_lib::ai_drafts::insert_finding_draft(
            conn,
            &case_id,
            "Duplicate invoices",
            "Two invoices share the same vendor reference on p.1.",
            "medium",
            &[file_id.clone()],
            &["p.1".to_string()],
            "test",
        )
        .unwrap();
        let d2 = desktop_backend_lib::ai_drafts::insert_finding_draft(
            conn,
            &case_id,
            "Duplicate invoices (copy)",
            "Vendor reference overlap noted on page one.",
            "medium",
            &[file_id.clone()],
            &["p.1".to_string()],
            "test",
        )
        .unwrap();

        desktop_backend_lib::ai_drafts::insert_finding_draft(
            conn,
            &case_id,
            "Merged finding",
            "Consolidated duplicate invoice observation across files.",
            "medium",
            &[file_id.clone()],
            &[],
            "test",
        )
        .unwrap();
        desktop_backend_lib::ai_drafts::mark_drafts_merged(conn, &[d1, d2]).unwrap();

        let pending: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM ai_finding_drafts WHERE case_id = ?1 AND status = 'pending'",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(pending, 1);

        let merged: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM ai_finding_drafts WHERE case_id = ?1 AND status = 'merged'",
                params![case_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(merged, 2);
        Ok(())
    });
}

#[test]
fn flow_report_draft_round_trip() {
    use desktop_backend_lib::report_drafts::{self, ReportDraft, ReportSectionStatus};
    use desktop_backend_lib::reports::{ReportDocument, ReportSection};

    let (_dir, db) = temp_db();
    let _ = with_db(&db, |conn| {
        let case_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Report Draft', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();

        let doc = ReportDocument {
            template_id: "cfe-long".into(),
            case_id: case_id.clone(),
            generated_at: now.clone(),
            sections: vec![
                ReportSection {
                    id: "executive".into(),
                    heading: "Executive Summary".into(),
                    text: "Summary body.".into(),
                    citations: vec![],
                    standards_tags: vec![],
                },
                ReportSection {
                    id: "findings".into(),
                    heading: "Findings".into(),
                    text: "Edited findings.".into(),
                    citations: vec![],
                    standards_tags: vec![],
                },
            ],
            compliance: vec![],
            markdown: String::new(),
        };
        let mut section_status = report_drafts::initial_status_map(&doc);
        section_status.insert("findings".into(), ReportSectionStatus::Edited);

        let draft = ReportDraft {
            id: String::new(),
            case_id: case_id.clone(),
            template_id: "cfe-long".into(),
            document: doc,
            section_status,
            generated_at: now.clone(),
            updated_at: now,
        };

        let saved = report_drafts::save_draft(conn, &draft).expect("save draft");
        let loaded = report_drafts::get_draft(conn, &case_id, "cfe-long")
            .expect("get draft")
            .expect("draft row");
        assert_eq!(loaded.document.sections.len(), 2);
        assert_eq!(
            loaded.section_status.get("findings"),
            Some(&ReportSectionStatus::Edited)
        );
        assert!(!saved.id.is_empty());
        Ok(())
    });
}
