# Persistence Mapping (v1 SQLite → v2 Target)

## Overview

| v1 | v2 today | v2 target |
|----|----------|-----------|
| `~/…/com.casespace/casespace.db` | `casespace-v2-store.json` | `casespace.db` (SQLite + WAL) |

JSON store is **deprecated** after Phase 1 persistence lands.

## Table mapping

| v1 table | v2 target | Notes |
|----------|-----------|-------|
| `cases` | `cases` | Add camelCase DTO mapping |
| `case_sources` | `case_sources` | Split from embedded `source_paths` |
| `files` | `files` | Include `status`, `file_hash`, `deleted_at` |
| `file_metadata` | `file_metadata` | `inventory_data` JSON column |
| `notes` | `notes` | + `file_id`, `pinned` |
| `findings` | `findings` | + severity, tags, links |
| `timeline_events` | `timeline_events` | + `source_file_id`, `event_type` |
| `duplicate_groups` | `duplicate_groups` | P1 |
| `column_configs` | `column_configs` | P1 |
| `mapping_configs` | `mapping_configs` | P1 |
| `workspace_preferences` | `workspace_preferences` | P1 |
| `app_settings` | `app_settings` | P1 |
| `time_entries` | `time_entries` | Port v1 shape |
| `time_segments` | `time_segments` | P1 |
| `active_timers` | `active_timers` | P0 |
| `case_billing_config` | `case_billing_config` | P0 |
| `_migrations` | `_migrations` | sqlx migrations |

## FTS mapping

| v1 FTS | v2 target | Trigger |
|--------|-----------|---------|
| files FTS | `files_fts` | sync on files insert/update/delete |
| notes FTS | `notes_fts` | sync on notes |
| findings FTS | `findings_fts` | sync on findings |
| timeline FTS | `timeline_fts` | sync on timeline |

Port `sanitize_fts_query` from v1 `lib.rs`.

## JSON store field mapping (interim)

| JSON `Store` field | Target table |
|------------------|--------------|
| `cases` | `cases` + `case_sources` |
| `notes` | `notes` |
| `findings` | `findings` |
| `timeline_events` | `timeline_events` |
| `time_entries` | `time_entries` |
| `inventory_items` | `files` (+ metadata) |

## Migration phases

1. Implement schema + repositories (no UI change)
2. Dual-write behind flag (optional, short)
3. Cut over reads to SQLite
4. Remove JSON persist from `lib.rs`
5. Optional v1 DB import tool (P1)

## Verification checks

- Per-case file count match after ingest
- Sample SHA-256 hashes match v1 for same folder
- FTS golden queries return same top-N doc IDs (allow rank drift)
- Timer active row uniqueness

See [spec/gap-analysis-data-schema.md](spec/gap-analysis-data-schema.md).
