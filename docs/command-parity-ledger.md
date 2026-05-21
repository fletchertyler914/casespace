# Command Parity Ledger

v1 command → v2 target → status. Source: v1 `lib.rs` + `time_tracking.rs`.

**Status:** `implemented` | `stub` | `planned`  
**Phase:** CoreParity commands only until parity gate passes.

| v1 command | v2 target module | v2 command (current/planned) | status | requirement_id | tests | security/perf gate |
|------------|------------------|------------------------------|--------|----------------|-------|-------------------|
| `create_case` | cases | `create_case` | implemented | REQ-CASE-001 | integration | — |
| `list_cases` | cases | `list_cases` | implemented | REQ-CASE-001 | integration | — |
| `get_case` | cases | `get_case` | planned | REQ-CASE-001 | integration | — |
| `update_case_metadata` | cases | `update_case_metadata` | planned | REQ-CASE-001 | integration | — |
| `delete_case` | cases | `delete_case` | implemented | REQ-CASE-001 | integration, e2e | destructive confirm |
| `get_or_create_case` | cases | `get_or_create_case` | planned | REQ-CASE-001 | integration | — |
| `add_case_source` | cases | `add_case_source` | planned | REQ-CASE-001 | integration | path validation |
| `list_case_sources` | cases | `list_case_sources` | planned | REQ-CASE-001 | integration | — |
| `count_directory_files` | ingest | `count_directory_files` | planned | REQ-INGEST-001 | integration | — |
| `scan_directory` | ingest | `scan_directory` | stub | REQ-INGEST-001 | integration | bounded scan |
| `ingest_files_to_case` | ingest | `ingest_files_to_case` | planned | REQ-INGEST-001 | perf, integration | concurrency cap |
| `load_case_files` | ingest | `load_case_files` | planned | REQ-INGEST-001 | integration | — |
| `load_case_files_with_inventory` | ingest | `load_case_files_with_inventory` | planned | REQ-INGEST-001 | e2e | — |
| `sync_case_all_sources` | ingest | `sync_case_all_sources` | planned | REQ-INGEST-001 | integration | cancel support |
| `refresh_single_file` | ingest | `refresh_single_file` | planned | REQ-INGEST-001 | integration | — |
| `refresh_files_bulk` | ingest | `refresh_files_bulk` | planned | REQ-INGEST-001 | perf | bounded |
| `check_file_changed` | files | `check_file_changed` | planned | REQ-VIEW-001 | integration | — |
| `create_note` | artifacts | `create_note` | implemented | REQ-ARTIFACT-001 | integration | — |
| `list_notes` | artifacts | `list_notes` | implemented | REQ-ARTIFACT-001 | integration | — |
| `update_note` | artifacts | `update_note` | planned | REQ-ARTIFACT-001 | integration | — |
| `delete_note` | artifacts | `delete_note` | planned | REQ-ARTIFACT-001 | integration | — |
| `toggle_note_pinned` | artifacts | `toggle_note_pinned` | planned | REQ-ARTIFACT-001 | integration | — |
| `create_finding` | artifacts | `create_finding` | implemented | REQ-ARTIFACT-001 | integration | — |
| `list_findings` | artifacts | `list_findings` | implemented | REQ-ARTIFACT-001 | integration | — |
| `update_finding` | artifacts | `update_finding` | planned | REQ-ARTIFACT-001 | integration | — |
| `delete_finding` | artifacts | `delete_finding` | planned | REQ-ARTIFACT-001 | integration | — |
| `create_timeline_event` | artifacts | `create_timeline_event` | implemented | REQ-ARTIFACT-001 | integration | — |
| `list_timeline_events` | artifacts | `list_timeline_events` | implemented | REQ-ARTIFACT-001 | integration | — |
| `update_timeline_event` | artifacts | `update_timeline_event` | planned | REQ-ARTIFACT-001 | integration | — |
| `delete_timeline_event` | artifacts | `delete_timeline_event` | planned | REQ-ARTIFACT-001 | integration | — |
| `search_files` | search | `search_files` | planned | REQ-SEARCH-001 | integration | FTS sanitize |
| `search_notes` | search | `search_notes` | planned | REQ-SEARCH-001 | integration | FTS sanitize |
| `search_all` | search | `search_all` | stub | REQ-SEARCH-001 | integration | query bounds |
| `read_file_text` | files | `read_file_text` | implemented | REQ-VIEW-001 | security | case roots |
| `write_file_text` | files | `write_file_text` | implemented | REQ-VIEW-001 | security | case roots |
| `read_file_base64` | files | `read_file_base64` | planned | REQ-VIEW-001 | integration | case roots |
| `open_file` | files | `open_file` | stub | REQ-VIEW-001 | e2e | opener plugin |
| `rename_file` | files | `rename_file` | planned | REQ-SEC-001 | security | confirm |
| `remove_file_from_case` | files | `remove_file_from_case` | planned | REQ-SEC-001 | security | confirm |
| `update_file_status` | files | `update_file_status` | planned | REQ-REVIEW-001 | integration | — |
| `find_duplicate_files` | duplicates | `find_duplicate_files` | planned | REQ-INGEST-001 | integration | — |
| `mark_duplicate_primary` | duplicates | `mark_duplicate_primary` | planned | REQ-INGEST-001 | integration | confirm |
| `merge_duplicate_metadata` | duplicates | `merge_duplicate_metadata` | planned | REQ-SEC-001 | integration | audit |
| `start_timer` | billing | `start_timer` | implemented | REQ-TIME-001 | integration | — |
| `stop_timer` | billing | `stop_timer` | implemented | REQ-TIME-001 | integration | — |
| `pause_timer` | billing | `pause_timer` | planned | REQ-TIME-001 | integration | — |
| `resume_timer` | billing | `resume_timer` | planned | REQ-TIME-001 | integration | — |
| `get_time_entries` | billing | `get_time_entries` | implemented | REQ-TIME-001 | integration | — |
| `calculate_billing_amount` | billing | `calculate_billing_amount` | planned | REQ-TIME-001 | unit | — |
| `get/save_*_config_db` | config | various | planned | REQ-CASE-001 | unit | schema validate |
| `extract_file_metadata` | ingest | `extract_file_metadata` | planned | REQ-INGEST-001 | integration | — |
| `run_ocr_preview` | ai | `run_ocr_preview` | stub | REQ-AI-001 | — | AI phase |
| `generate_case_report` | reports | `generate_case_report` | stub | REQ-REPORT-001 | e2e | non-AI template first |

See [spec/commands-and-contracts.md](spec/commands-and-contracts.md) and [spec/gap-analysis-backend.md](spec/gap-analysis-backend.md).
