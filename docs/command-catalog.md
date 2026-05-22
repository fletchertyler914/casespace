# Command Catalog

Native Tauri commands exposed to `apps/desktop` via `lib/command-client.ts`.

**Status:** `implemented` | `stub` | `planned`  
**Backend:** P0 non-AI commands **implemented** (local integration + hardening validated).

| Command | Module | Status | Requirement |
|---------|--------|--------|-------------|
| `create_case` | cases | implemented | REQ-CASE-001 |
| `list_cases` | cases | implemented | REQ-CASE-001 |
| `get_case` | cases | implemented | REQ-CASE-001 |
| `update_case_metadata` | cases | implemented | REQ-CASE-001 |
| `delete_case` | cases | implemented | REQ-CASE-001 |
| `get_or_create_case` | cases | implemented | REQ-CASE-001 |
| `add_case_source` | cases | implemented | REQ-CASE-001 |
| `list_case_sources` | cases | implemented | REQ-CASE-001 |
| `count_directory_files` | ingest | implemented | REQ-INGEST-001 |
| `scan_directory` | ingest | implemented | REQ-INGEST-001 |
| `ingest_files_to_case` | ingest | implemented | REQ-INGEST-001 |
| `load_case_files` | ingest | implemented | REQ-INGEST-001 |
| `load_case_files_with_inventory` | ingest | implemented | REQ-INGEST-001 |
| `sync_case_all_sources` | ingest | implemented | REQ-INGEST-001 |
| `refresh_single_file` | ingest | implemented | REQ-INGEST-001 |
| `refresh_files_bulk` | ingest | implemented | REQ-INGEST-001 |
| `check_file_changed` | files | implemented | REQ-VIEW-001 |
| `create_note` | artifacts | implemented | REQ-ARTIFACT-001 |
| `list_notes` | artifacts | implemented | REQ-ARTIFACT-001 |
| `update_note` | artifacts | implemented | REQ-ARTIFACT-001 |
| `delete_note` | artifacts | implemented | REQ-ARTIFACT-001 |
| `toggle_note_pinned` | artifacts | implemented | REQ-ARTIFACT-001 |
| `create_finding` | artifacts | implemented | REQ-ARTIFACT-001 |
| `list_findings` | artifacts | implemented | REQ-ARTIFACT-001 |
| `update_finding` | artifacts | implemented | REQ-ARTIFACT-001 |
| `delete_finding` | artifacts | implemented | REQ-ARTIFACT-001 |
| `create_timeline_event` | artifacts | implemented | REQ-ARTIFACT-001 |
| `list_timeline_events` | artifacts | implemented | REQ-ARTIFACT-001 |
| `update_timeline_event` | artifacts | implemented | REQ-ARTIFACT-001 |
| `delete_timeline_event` | artifacts | implemented | REQ-ARTIFACT-001 |
| `search_files` | search | implemented | REQ-SEARCH-001 |
| `search_notes` | search | implemented | REQ-SEARCH-001 |
| `search_all` | search | implemented | REQ-SEARCH-001 |
| `read_file_text` | files | implemented | REQ-VIEW-001 |
| `write_file_text` | files | implemented | REQ-VIEW-001 |
| `read_file_base64` | files | implemented | REQ-VIEW-001 |
| `open_file` | files | implemented | REQ-VIEW-001 |
| `rename_file` | files | implemented | REQ-SEC-001 |
| `remove_file_from_case` | files | implemented | REQ-SEC-001 |
| `update_file_status` | files | implemented | REQ-REVIEW-001 |
| `find_duplicate_files` | duplicates | implemented | REQ-INGEST-001 |
| `mark_duplicate_primary` | duplicates | implemented | REQ-INGEST-001 |
| `merge_duplicate_metadata` | duplicates | implemented | REQ-SEC-001 |
| `start_timer` | billing | implemented | REQ-TIME-001 — auto-stops other case timers |
| `stop_timer` | billing | implemented | REQ-TIME-001 — args: `caseId`, optional `summary` |
| `pause_timer` | billing | implemented | REQ-TIME-001 |
| `resume_timer` | billing | implemented | REQ-TIME-001 |
| `get_time_entries` | billing | implemented | REQ-TIME-001 — paginated `limit`, `offset` |
| `get_time_entry` | billing | implemented | REQ-TIME-001 — `caseId`, `date` (day) |
| `get_time_entries_summary` | billing | implemented | REQ-TIME-001 |
| `calculate_case_total` | billing | implemented | REQ-TIME-001 |
| `get_active_timer` | billing | implemented | REQ-TIME-001 |
| `update_time_entry` | billing | implemented | REQ-TIME-001 |
| `create_time_segment` | billing | implemented | REQ-TIME-001 |
| `update_time_segment` | billing | implemented | REQ-TIME-001 |
| `delete_time_segment` | billing | implemented | REQ-TIME-001 |
| `delete_time_entry` | billing | implemented | REQ-TIME-001 |
| `get_case_billing_config` | billing | implemented | REQ-TIME-001 |
| `set_case_billing_config` | billing | implemented | REQ-TIME-001 |
| `calculate_billing_amount` | billing | implemented | REQ-TIME-001 — fixed/daily/weekly/monthly + segment overrides |
| `extract_file_metadata` | ingest | implemented | REQ-INGEST-001 |
| `generate_case_report` | reports | implemented | REQ-REPORT-001 |
| `export_case_report` | reports | implemented | REQ-REPORT-001 |
| `run_ocr_preview` | ai | stub | REQ-AI-001 |

See [spec/commands-and-contracts.md](spec/commands-and-contracts.md).
