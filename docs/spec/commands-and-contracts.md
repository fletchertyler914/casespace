# Commands and Contracts

IPC boundary between `apps/desktop` and `apps/desktop-backend`. See [contracts gap analysis](#current-vs-target-contracts) below.

## Principles

- Desktop UI never calls `invoke` directly except through `apps/desktop/lib/command-client.ts` (and future `lib/services/*`).
- All commands return structured errors (target: `CommandResponse<T>` from `@repo/types`).
- Rust DTOs use `#[serde(rename_all = "camelCase")]` to match TypeScript.
- Case-scoped file paths validated against case source roots.

## Current v2 commands (implemented)

| Command | Domain | Status | Requirement |
|---------|--------|--------|-------------|
| `create_case` | cases | implemented | REQ-CASE-001 |
| `list_cases` | cases | implemented | REQ-CASE-001 |
| `delete_case` | cases | implemented | REQ-CASE-001 |
| `create_note` / `list_notes` | artifacts | partial | REQ-ARTIFACT-001 |
| `create_finding` / `list_findings` | artifacts | partial | REQ-ARTIFACT-001 |
| `create_timeline_event` / `list_timeline_events` | artifacts | partial | REQ-ARTIFACT-001 |
| `start_timer` / `stop_timer` / `get_time_entries` | billing | stub | REQ-TIME-001 |
| `scan_directory` | ingest | stub (no persist) | REQ-INGEST-001 |
| `search_all` | search | stub (substring) | REQ-SEARCH-001 |
| `read_file_text` / `write_file_text` / `open_file` | files | partial | REQ-VIEW-001 |
| `run_ocr_preview` | ai | stub | REQ-AI-001 (deferred) |
| `generate_case_report` | reports | stub | REQ-REPORT-001 |

## Target v2 command modules (CoreParity)

Planned under `apps/desktop-backend/src-tauri/src/commands/`:

| Module | v1 reference commands |
|--------|----------------------|
| `cases` | `get_case`, `update_case_metadata`, `get_or_create_case`, source CRUD |
| `ingest` | `count_directory_files`, `scan_directory`, `ingest_files_to_case`, `sync_*`, `refresh_*` |
| `files` | `read_file_base64`, `rename_file`, `remove_file_from_case`, `update_file_status`, `check_file_changed` |
| `search` | `search_files`, `search_notes`, `search_all` (FTS) |
| `artifacts` | note/finding/timeline full CRUD + pin + file note counts |
| `duplicates` | `find_duplicate_files`, groups, merge, mark primary |
| `config` | column/mapping/workspace/system filter prefs |
| `billing` | pause/resume timer, segments, billing config, calculations |

## Command envelope (target)

```typescript
// packages/types/src/contracts.ts
interface CommandResponse<T> {
  ok: boolean;
  data?: T;
  error?: AppErrorEnvelope;
}
```

Backend should map `Result<T, AppError>` to this shape at the adapter boundary.

## Current vs target contracts

| Type / field | Current TS (`contracts.ts`) | Current Rust (`lib.rs`) | Target |
|--------------|----------------------------|-------------------------|--------|
| `CaseSummary.sourcePaths` | missing | `source_paths: Vec<String>` | Add to TS |
| `CaseSummary.status` | `active \| archived` | `String` freeform | Align enum |
| `InventoryItem` | flat fields | flat fields | Add `status`, `hash`, `inventoryData` |
| `SearchResult` | typed | `search_all` returns `Vec<String>` | Return `SearchResult[]` |
| `TimeEntry.billableMinutes` | present | absent | Add segments/billing model |
| `CommandRequest` / `CommandResponse` | defined | unused | Enforce in adapter |
| Payload casing | camelCase in TS invoke | snake_case in Rust | `rename_all = "camelCase"` |

## Error codes

Use `AppErrorCode` from `@repo/types`: `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `PERMISSION_DENIED`, `RATE_LIMITED`, `INTERNAL_ERROR`.

Path violations → `PERMISSION_DENIED`. Missing case → `NOT_FOUND`.

## Security constraints (per command class)

| Class | Commands | Controls |
|-------|----------|----------|
| Destructive | `delete_case`, `remove_file_from_case`, `merge_duplicate_metadata` | Confirm UX + audit log |
| File write | `write_file_text`, `rename_file` | Case-root canonicalization |
| File read/open | `read_file_*`, `open_file` | Case-root only |
| Bulk | `ingest_*`, `sync_*`, `refresh_files_bulk` | Bounded concurrency, cancel |

## Tests

| Suite | Scope |
|-------|--------|
| unit | path validation, FTS sanitize, billing math |
| integration | command round-trip serde, DB + command |
| security | traversal paths, out-of-root access |
| e2e | desktop adapter → backend for P0 flows |

See [test-oracle-matrix.md](test-oracle-matrix.md).
