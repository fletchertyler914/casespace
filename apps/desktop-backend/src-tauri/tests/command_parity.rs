//! Command-path integration tests: same Rust modules Tauri commands use (ingest, FTS, reports).

mod common;

use common::*;
use desktop_backend_lib::ingest;
use desktop_backend_lib::{build_report_body, fts_search};
use rusqlite::params;

#[test]
fn flow_mini_case_ingest_all_sources() {
    let fixture = mini_case_fixture_dir();
    if !fixture.is_dir() {
        panic!("missing fixture dir: {}", fixture.display());
    }
    let (_dir, db) = temp_db();
    let case_id = uuid::Uuid::new_v4().to_string();
    let source = fixture.to_string_lossy().to_string();

    with_conn_mut(&db, |conn| {
        seed_case_with_source(conn, &case_id, &source);
        let result = ingest::ingest_all_sources(conn, &case_id, &[source], false, 500)?;
        let count = file_count(conn, &case_id);
        assert!(
            count >= 2,
            "expected >=2 files in DB, got {count}; ingest={result:?}"
        );
        Ok(())
    });
}

#[test]
fn flow_incremental_reingest_skips_unchanged() {
    let fixture = mini_case_fixture_dir();
    let (_dir, db) = temp_db();
    let case_id = uuid::Uuid::new_v4().to_string();
    let source = fixture.to_string_lossy().to_string();

    with_conn_mut(&db, |conn| {
        seed_case_with_source(conn, &case_id, &source);
        let first = ingest::ingest_all_sources(conn, &case_id, &[source.clone()], false, 500)?;
        assert!(file_count(conn, &case_id) >= 2, "first ingest: {first:?}");
        let second = ingest::ingest_all_sources(conn, &case_id, &[source], true, 500)?;
        assert_eq!(second.files_inserted, 0, "second ingest: {second:?}");
        assert!(second.files_skipped >= 2, "second ingest: {second:?}");
        Ok(())
    });
}

#[test]
fn flow_ingest_rejects_unsafe_source_path() {
    let (_dir, db) = temp_db();
    let case_id = uuid::Uuid::new_v4().to_string();

    with_conn_mut(&db, |conn| {
        seed_case_with_source(conn, &case_id, "/tmp/safe");
        let err = ingest::ingest_source(conn, &case_id, "../etc/passwd", false, 100)
            .expect_err("unsafe path should fail");
        assert!(err.contains("unsafe"));
        Ok(())
    });
}

#[test]
fn flow_identical_files_create_duplicate_group() {
    let (dir, db) = temp_db();
    let dup_dir = dir.join("dup-sources");
    let source = write_identical_pair(&dup_dir);
    let case_id = uuid::Uuid::new_v4().to_string();

    with_conn_mut(&db, |conn| {
        seed_case_with_source(conn, &case_id, &source);
        ingest::ingest_all_sources(conn, &case_id, &[source], false, 500)?;
        assert_eq!(file_count(conn, &case_id), 2);
        assert_eq!(duplicate_group_count(conn, &case_id), 1);
        Ok(())
    });
}

#[test]
fn flow_fts_search_all_entity_types() {
    let (_dir, db) = temp_db();
    let case_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    with_conn(&db, |conn| {
        seed_case_with_source(conn, &case_id, "/tmp/unused");
        conn.execute(
            "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status)
             VALUES ('f1', ?1, 'orion-report.pdf', '', '/tmp/orion-report.pdf', 'h1', 1, ?2, 'unreviewed')",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO notes (id, case_id, content, pinned, created_at, updated_at) VALUES ('n1', ?1, 'orion note body', 0, ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO findings (id, case_id, title, description, severity, created_at, updated_at) VALUES ('fd1', ?1, 'orion finding', 'detail', 'high', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO timeline_events (id, case_id, description, occurred_at, event_type, created_at) VALUES ('t1', ?1, 'orion interview', ?2, 'meeting', ?2)",
            params![case_id, now],
        )
        .unwrap();

        let hits = fts_search(conn, &case_id, "orion", 20)?;
        let types: std::collections::HashSet<_> =
            hits.iter().map(|h| h.entity_type.as_str()).collect();
        assert!(types.contains("file"));
        assert!(types.contains("note"));
        assert!(types.contains("finding"));
        assert!(types.contains("timeline"));
        Ok(())
    });
}

#[test]
fn flow_build_report_body_non_empty_for_all_kinds() {
    let (_dir, db) = temp_db();
    let case_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    with_conn(&db, |conn| {
        seed_case_with_source(conn, &case_id, "/tmp/src");
        conn.execute(
            "INSERT INTO case_billing_config (case_id, billing_type, pay_rate, rate_unit, created_at, updated_at) VALUES (?1, 'pay_rate', 100.0, 'hourly', ?2, ?2)",
            params![case_id, now],
        )
        .unwrap();

        for kind in [
            "narrative",
            "executive",
            "evidence_index",
            "financial",
            "billing_invoice",
        ] {
            let body = build_report_body(&case_id, conn, kind)?;
            assert!(
                body.len() > 20,
                "report {kind} should have substantive body"
            );
        }
        Ok(())
    });
}

#[test]
fn flow_scan_source_matches_mini_case_files() {
    let fixture = mini_case_fixture_dir();
    let scanned = ingest::scan_source(&fixture, 100).expect("scan mini-case");
    assert!(scanned.len() >= 2, "fixture should contain at least a.txt and b.txt");
    let names: Vec<_> = scanned.iter().map(|f| f.file_name.as_str()).collect();
    assert!(names.contains(&"a.txt"));
    assert!(names.contains(&"b.txt"));
}
