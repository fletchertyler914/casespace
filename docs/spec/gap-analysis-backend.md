# Backend Gap Analysis (v1 -> v2)

## Scope and source refs

- **v1:** `inventory-generator/src-tauri/src/lib.rs`, `time_tracking.rs`, `database.rs`, `scanner.rs`, `file_ingestion.rs`, `repositories/*`
- **v2:** `casespace/apps/desktop-backend/src-tauri/src/lib.rs` (~20 commands, JSON store)

## Command/domain inventory table

| domain | v1 command/module | v2 location | classification | launch tier | recommendation | requirement_id | notes | test |
|--------|-------------------|-------------|----------------|-------------|----------------|----------------|-------|------|
| cases | `create_case` | `lib.rs` | portable-with-redesign | P0 | rewrite | REQ-CASE-001 | Add sources table | integration |
| cases | `list_cases` | `lib.rs` | portable-with-redesign | P0 | rewrite | REQ-CASE-001 | | integration |
| cases | `get_case` | — | missing-in-v2 | P0 | rewrite | REQ-CASE-001 | | integration |
| cases | `update_case_metadata` | — | missing-in-v2 | P1 | rewrite | REQ-CASE-001 | | integration |
| cases | `delete_case` | `lib.rs` | portable-with-redesign | P0 | rewrite | REQ-CASE-001 | Add FK cascade | integration |
| cases | `get_or_create_case` | — | missing-in-v2 | P1 | rewrite | REQ-CASE-001 | | integration |
| ingest | `count_directory_files` | — | missing-in-v2 | P0 | rewrite | REQ-INGEST-001 | | integration |
| ingest | `scan_directory` | `lib.rs` stub | not-portable-replace | P0 | rewrite | REQ-INGEST-001 | No persist | integration |
| ingest | `ingest_files_to_case` | — | missing-in-v2 | P0 | rewrite | REQ-INGEST-001 | | perf |
| ingest | `sync_inventory` | — | not-portable-replace | P1 | drop | REQ-INGEST-001 | DB-centric replace | integration |
| ingest | `load_case_files*` | — | missing-in-v2 | P0 | rewrite | REQ-INGEST-001 | | integration |
| ingest | `sync_case_all_sources` | — | missing-in-v2 | P1 | rewrite | REQ-INGEST-001 | | integration |
| artifacts | `create_note` / `list_notes` | `lib.rs` | portable-with-redesign | P0 | rewrite | REQ-ARTIFACT-001 | No update/delete | integration |
| artifacts | `update_note` / `delete_note` | — | missing-in-v2 | P0 | rewrite | REQ-ARTIFACT-001 | | integration |
| artifacts | findings CRUD | partial | portable-with-redesign | P0 | rewrite | REQ-ARTIFACT-001 | | integration |
| artifacts | timeline CRUD | partial | portable-with-redesign | P0 | rewrite | REQ-ARTIFACT-001 | | integration |
| search | `search_files` / `search_notes` | — | missing-in-v2 | P0 | rewrite | REQ-SEARCH-001 | FTS | integration |
| search | `search_all` | `lib.rs` stub | not-portable-replace | P0 | rewrite | REQ-SEARCH-001 | Substring only | integration |
| files | `read_file_text` / `write_file_text` | `lib.rs` | portable-as-is | P0 | port | REQ-VIEW-001 | Case-scoped | security |
| files | `read_file_base64` | — | missing-in-v2 | P1 | rewrite | REQ-VIEW-001 | | integration |
| files | `open_file` | `lib.rs` partial | portable-with-redesign | P0 | rewrite | REQ-VIEW-001 | Use opener plugin | e2e |
| files | `rename_file` / `remove_file_from_case` | — | missing-in-v2 | P1 | rewrite | REQ-SEC-001 | | security |
| duplicates | duplicate suite | — | missing-in-v2 | P1 | rewrite | REQ-INGEST-001 | | integration |
| config | prefs DB commands | — | missing-in-v2 | P1 | rewrite | REQ-CASE-001 | | unit |
| billing | `time_tracking.rs` full | partial stub | portable-with-redesign | P0 | rewrite | REQ-TIME-001 | Segments missing | integration |
| ai | `run_ocr_preview` | `lib.rs` stub | missing-in-v2 | P2 | defer | REQ-AI-001 | AI phase | — |
| ai | `generate_case_report` | `lib.rs` stub | missing-in-v2 | P0 | rewrite | REQ-REPORT-001 | Non-AI first | e2e |

## Portable-as-is

- Path string guards (`..`, null) — extend with case roots
- UUID ID generation pattern
- Opener plugin registration

## Portable-with-redesign

- All CRUD commands → domain modules + SQLite
- Scanner/ingestion → async tokio + repositories
- Search → FTS5 service
- Time tracking → full `time_tracking` port

## Not-portable-replace

- v2 `scan_directory` ephemeral walkdir implementation
- v1 `sync_inventory` client-merge
- v2 JSON file store persistence
- v1 global-path `open_file` without case scope

## Missing-in-v2

~57 v1 commands not implemented (ingest suite, FTS search, duplicates, config DB, billing math, metadata extraction commands).

## Top high-risk backend migration items

| risk_id | description | impact | mitigation | owner_domain |
|---------|-------------|--------|------------|--------------|
| BE-R01 | JSON → SQLite cutover | critical | Phased migration + tests | persistence |
| BE-R02 | `ingest_files_to_case` parity | critical | Port file_ingestion module | ingest |
| BE-R03 | Path security unification | high | Single validation module | files |
| BE-R04 | FTS search parity | high | Port FTS DDL + sanitize | search |
| BE-R05 | Timer/billing transactions | high | Port time_tracking.rs | billing |
| BE-R06 | Contract serde drift | medium | camelCase + shared types | commands |
| BE-R07 | Duplicate merge safety | medium | Audit + confirm | duplicates |
| BE-R08 | Bulk ingest concurrency | medium | Bounded workers + cancel | ingest |
| BE-R09 | delete_case cascade | medium | FK + soft-delete rules | cases |
| BE-R10 | Test coverage gap | high | Port v1 test patterns | all |

## Backend execution cut (P0/P1/P2)

**P0:** cases CRUD+sources, ingest+load, FTS search, file ops scoped, artifacts CRUD, timer core, report aggregate export, SQLite foundation

**P1:** duplicates, refresh/sync, config prefs, base64 read, billing segments, PDF path

**P2:** AI commands, OCR provider, advanced metadata (symphonia/remeta)
