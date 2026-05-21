use desktop_backend_lib::database::Database;
use desktop_backend_lib::path::validate_safe_path;
use rusqlite::params;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;
use walkdir::WalkDir;

fn temp_db() -> (PathBuf, Database) {
    let dir = std::env::temp_dir().join(format!("casespace-hardening-{}", uuid::Uuid::new_v4()));
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoldenManifest {
    total_files: usize,
    extension_counts: HashMap<String, usize>,
    required_tokens: Vec<String>,
}

fn write_seed_fixture(root: &Path) -> Result<(), String> {
    fs::create_dir_all(root).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join("nested/a")).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join("nested/b")).map_err(|e| e.to_string())?;

    for i in 0..20 {
        let content = format!("ALPHA_TOKEN text file {i}\nBILLING_TOKEN");
        fs::write(root.join(format!("doc_{i:02}.txt")), content).map_err(|e| e.to_string())?;
    }
    for i in 0..5 {
        fs::write(
            root.join("nested/a").join(format!("note_{i:02}.md")),
            format!("# TIMELINE_TOKEN {i}\n"),
        )
        .map_err(|e| e.to_string())?;
    }
    for i in 0..5 {
        let payload = format!("{{\"id\":{i},\"token\":\"ALPHA_TOKEN\"}}");
        fs::write(root.join("nested/a").join(format!("meta_{i:02}.json")), payload)
            .map_err(|e| e.to_string())?;
    }
    for i in 0..5 {
        fs::write(
            root.join("nested/b").join(format!("rows_{i:02}.csv")),
            "col_a,col_b\n1,2\n",
        )
        .map_err(|e| e.to_string())?;
    }
    for i in 0..5 {
        fs::write(
            root.join("nested/b").join(format!("trace_{i:02}.log")),
            "TIMELINE_TOKEN log line\n",
        )
        .map_err(|e| e.to_string())?;
    }
    // Minimal PNG signature + IHDR chunk stub. Enough for binary/image handling paths.
    let png_bytes: [u8; 33] = [
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1,
        8, 2, 0, 0, 0, 144, 119, 83, 222,
    ];
    for i in 0..5 {
        fs::write(root.join(format!("image_{i:02}.png")), png_bytes).map_err(|e| e.to_string())?;
    }
    for i in 0..5 {
        let bytes = vec![i as u8; 64];
        fs::write(root.join(format!("blob_{i:02}.bin")), bytes).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn ingest_fixture(db: &Database, case_id: &str, source_path: &Path) {
    with_db(db, |conn| {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, 'Golden', 'active', ?2, ?2)",
            params![case_id, now],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO case_sources (id, case_id, source_path, added_at) VALUES (?1, ?2, ?3, ?4)",
            params![
                uuid::Uuid::new_v4().to_string(),
                case_id,
                source_path.to_string_lossy().to_string(),
                now
            ],
        )
        .map_err(|e| e.to_string())?;
        for entry in WalkDir::new(source_path).into_iter().filter_map(Result::ok) {
            if !entry.file_type().is_file() {
                continue;
            }
            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            let path = entry.path().to_string_lossy().to_string();
            let name = entry.file_name().to_string_lossy().to_string();
            let ext = entry
                .path()
                .extension()
                .map(|e| e.to_string_lossy().to_string())
                .unwrap_or_default();
            let hash = format!("{:x}", Sha256::digest(fs::read(entry.path()).unwrap_or_default()));
            conn.execute(
                "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_hash, file_size, modified_at, status, deleted_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'unreviewed', NULL)",
                params![
                    uuid::Uuid::new_v4().to_string(),
                    case_id,
                    name,
                    ext,
                    path,
                    hash,
                    metadata.len() as i64,
                    now
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    });
}

#[test]
fn hardening_seed_fixture_matches_golden_manifest() {
    let (dir, db) = temp_db();
    let fixture_root = dir.join("seed");
    write_seed_fixture(&fixture_root).unwrap();
    ingest_fixture(&db, "golden-case", &fixture_root);

    let manifest_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .join("fixtures/golden/v1-mini.expected.json");
    let manifest: GoldenManifest =
        serde_json::from_str(&fs::read_to_string(manifest_path).unwrap()).unwrap();

    with_db(&db, |conn| {
        let total: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE case_id = 'golden-case' AND deleted_at IS NULL",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        assert_eq!(total as usize, manifest.total_files);

        for (ext, expected) in manifest.extension_counts {
            let query_ext = ext.to_string();
            let count: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM files WHERE case_id = 'golden-case' AND lower(file_name) LIKE '%' || ?1",
                    params![format!(".{query_ext}")],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;
            assert_eq!(count as usize, expected, "extension mismatch: {query_ext}");
        }

        for token in manifest.required_tokens {
            // Token coverage check across text-ish files.
            let mut seen = false;
            for entry in WalkDir::new(&fixture_root).into_iter().filter_map(Result::ok) {
                if !entry.file_type().is_file() {
                    continue;
                }
                let path = entry.path();
                let ext = path.extension().and_then(|v| v.to_str()).unwrap_or_default();
                if matches!(ext, "txt" | "md" | "json" | "csv" | "log") {
                    let content = fs::read_to_string(path).unwrap_or_default();
                    if content.contains(&token) {
                        seen = true;
                        break;
                    }
                }
            }
            assert!(seen, "required token not found in fixture: {token}");
        }
        Ok(())
    });
}

#[test]
fn hardening_rejects_malformed_legacy_store() {
    let (_dir, db) = temp_db();
    let malformed = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .join("fixtures/malformed-store.json");
    let result = db.import_json_store(&malformed);
    assert!(result.is_err(), "malformed JSON store should fail closed");
}

#[test]
fn hardening_path_escape_is_rejected() {
    let roots = vec!["/tmp/casespace-safe-root".to_string()];
    let escaped = validate_safe_path("/tmp/casespace-safe-root/../escape.txt", &roots);
    assert!(escaped.is_err());
}

#[test]
fn hardening_large_ingest_10k_files() {
    let (dir, db) = temp_db();
    let root = dir.join("large-seed");
    fs::create_dir_all(&root).unwrap();

    for i in 0..10_000 {
        let path = root.join(format!("f_{i:05}.txt"));
        fs::write(path, format!("record {i}")).unwrap();
    }

    let start = Instant::now();
    ingest_fixture(&db, "large-case", &root);
    let elapsed = start.elapsed();

    with_db(&db, |conn| {
        let total: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE case_id = 'large-case' AND deleted_at IS NULL",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        assert_eq!(total, 10_000);
        Ok(())
    });

    // Generous upper bound so this remains stable in CI and local laptops.
    assert!(
        elapsed.as_secs() < 120,
        "10k ingest exceeded hardening budget: {:?}",
        elapsed
    );
}
