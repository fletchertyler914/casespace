# Data and Schema Gap Analysis (v1 -> v2)

## Scope and source refs

- **v1:** `inventory-generator/src-tauri/src/database.rs`, migrations, FTS
- **v2:** `lib.rs` JSON `Store`, `packages/types/src/contracts.ts`

## Entity mapping table

| entity | v1 schema | v2 schema | classification | migration_strategy | launch tier | requirement_id | test |
|--------|-----------|-----------|----------------|--------------------|-------------|----------------|------|
| cases | `cases` table | JSON HashMap | portable-with-redesign | New table + ETL | P0 | REQ-CASE-001 | integration |
| case_sources | `case_sources` | `source_paths[]` | portable-with-redesign | Normalize table | P0 | REQ-CASE-001 | integration |
| files | `files` + soft delete | `inventory_items` vec | portable-with-redesign | Full schema port | P0 | REQ-INGEST-001 | integration |
| file_metadata | `file_metadata` | — | missing-in-v2 | Add table | P0 | REQ-INGEST-001 | integration |
| notes | `notes` | JSON vec | portable-with-redesign | Table + FTS | P0 | REQ-ARTIFACT-001 | integration |
| findings | `findings` | JSON vec | portable-with-redesign | Table + FTS | P0 | REQ-ARTIFACT-001 | integration |
| timeline_events | `timeline_events` | JSON vec | portable-with-redesign | Table + FTS | P0 | REQ-ARTIFACT-001 | integration |
| duplicate_groups | table | — | missing-in-v2 | Port v1 DDL | P1 | REQ-INGEST-001 | integration |
| time_entries | v1 model | flat stub | portable-with-redesign | Port time_tracking schema | P0 | REQ-TIME-001 | integration |
| time_segments | table | — | missing-in-v2 | Port | P1 | REQ-TIME-001 | integration |
| billing_config | table | — | missing-in-v2 | Port | P0 | REQ-TIME-001 | unit |
| workspace_prefs | table | — | missing-in-v2 | Port | P1 | REQ-CASE-001 | unit |
| FTS indexes | FTS5 virtual | — | missing-in-v2 | Port triggers | P0 | REQ-SEARCH-001 | integration |

## Index/search/FTS parity analysis

v1: external-content FTS + porter unicode61 + sync triggers + `sanitize_fts_query`.

v2: none. **Rewrite required** before search UX ships.

## Data integrity and auditability gaps

| Gap | v2 issue | Fix |
|-----|----------|-----|
| DA-G01 | `unwrap_or_default` on corrupt JSON | Fail-closed error |
| DA-G02 | No transactions | sqlx transactions |
| DA-G03 | No FK | Enable FK pragma |
| DA-G04 | No soft-delete in lists | Repository filters |
| DA-G05 | No audit log | P1 audit_events table |

## Portable-as-is

- Conceptual entity relationships from v1 ER diagram
- WAL + foreign_keys pragma pattern

## Portable-with-redesign

- All tables with possible column renames for camelCase DTO mapping
- FTS trigger pattern (verify tokenizer parity)

## Not-portable-replace

- `casespace-v2-store.json` format
- Client-side inventory merge from `sync_inventory`

## Missing-in-v2

FTS, duplicates, config tables, segments, billing, file_metadata, migrations.

## Data migration strategy (phased)

1. **Phase A:** Implement SQLite schema v1 (core tables) in `database.rs`
2. **Phase B:** Application writes only to SQLite; remove JSON persist
3. **Phase C:** Optional `import_v1_db` command (read v1 `casespace.db`, write v2 schema)
4. **Rollback:** Backup DB file before import; migration down scripts

**Verification:** row counts per case, file hash samples, FTS hit parity on golden queries.

## Required fixture and test datasets

| Fixture | Purpose | test |
|---------|---------|------|
| `fixtures/mini-case/` | CRUD smoke | integration |
| `fixtures/large-case/` | 10k ingest perf | perf |
| `fixtures/v1-mini.db` | Import golden | integration |
| `fixtures/corrupt.json` | Fail-closed | unit |
