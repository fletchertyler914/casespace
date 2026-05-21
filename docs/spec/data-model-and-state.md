# Data Model and State

## Persistence strategy

| Stage | Storage | Status |
|-------|---------|--------|
| v2 scaffold (today) | `casespace-v2-store.json` in app data dir | **Replace** — not production target |
| CoreParity target | SQLite (`casespace.db`) + WAL + migrations | planned |
| Search | FTS5 virtual tables + triggers | planned |

v1 reference: `inventory-generator/src-tauri/src/database.rs`

## Core entities (target schema)

### cases

- `id`, `name`, `status`, `department`, `client`, `last_opened_at`, timestamps
- v2 scaffold: minimal `CaseSummary` in JSON only

### case_sources

- `case_id`, `path`, `label`, `added_at`
- v2 scaffold: `source_paths[]` on case — normalize to table

### files + file_metadata

- File row: path, hash, status, tags, soft-delete (`deleted_at`)
- Metadata: extracted fields JSON (`inventory_data` pattern from v1)

### notes, findings, timeline_events

- Full CRUD; notes link optional `file_id`, `pinned`
- Findings: severity, tags, linked files
- Timeline: `event_date`, `source_file_id`, `event_type`

### duplicate_groups

- Hash-based grouping; primary file selection

### time_entries, time_segments, active_timers, case_billing_config

- v1 `time_tracking.rs` model — port with redesign
- v2 stub: flat `TimeEntry` without segments/billing

### config tables

- `column_configs`, `mapping_configs`, `workspace_preferences`, `app_settings`, `system_file_filter`

## FTS (target)

Mirror v1:

- `files_fts`, `notes_fts`, `findings_fts`, `timeline_fts` (names per v1 migration)
- Porter unicode61 tokenizer
- Sync triggers on insert/update/delete
- `sanitize_fts_query` before query execution

## Desktop state (target)

| Store | Responsibility |
|-------|----------------|
| `lib/state/caseStore` | active case, case list cache |
| `lib/state/inventoryStore` | files for active case, selection |
| `lib/state/workspaceStore` | panel layout, view mode, prefs |
| `lib/hooks/*` | orchestration only; no raw invoke |

v1 used Zustand (`inventoryStore`, `settingsStore`) — pattern portable with redesign.

## JSON store deprecation

1. Implement SQLite schema v1 (core tables)
2. Dual-write or one-time import from JSON (dev only)
3. Remove JSON persistence from `lib.rs`
4. Migration tool: optional v1 `casespace.db` → v2 schema (P1)

## Data integrity requirements

- Foreign keys ON
- Transactions for ingest batches and timer transitions
- No silent `unwrap_or_default` on corrupt DB/files
- Soft-delete respected in all list/search paths

## Requirement linkage

| Requirement | Entities |
|-------------|----------|
| REQ-INGEST-001 | files, file_metadata, case_sources |
| REQ-SEARCH-001 | FTS tables |
| REQ-ARTIFACT-001 | notes, findings, timeline_events |
| REQ-TIME-001 | time_*, case_billing_config |

See [persistence-mapping.md](../persistence-mapping.md) and [gap-analysis-data-schema.md](gap-analysis-data-schema.md).
