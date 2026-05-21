# Command Parity Ledger

v1 command → v2 target → status. Source: v1 `lib.rs` + `time_tracking.rs`.

**Status:** `implemented` | `stub` | `planned`  
**Phase:** CoreParity commands only until parity gate passes.

| v1 command | v2 target module | v2 command (current/planned) | status | requirement_id | tests | security/perf gate |
|------------|------------------|------------------------------|--------|----------------|-------|-------------------|
| `create_case` | cases | `create_case` | implemented | REQ-CASE-001 | integration | — |
| `list_cases` | cases | `list_cases` | implemented | REQ-CASE-001 | integration | — |
| `get_case` | cases | `get_case` | implemented | REQ-CASE-001 | integration | — |
| `update_case_metadata` | cases | `update_case_metadata` | implemented | REQ-CASE-001 | integration | — |
| `delete_case` | cases | `delete_case` | implemented | REQ-CASE-001 | integration, e2e | destructive confirm |
| `get_or_create_case` | cases | `get_or_create_case` | implemented | REQ-CASE-001 | integration | — |
| `add_case_source` | cases | `add_case_source` | implemented | REQ-CASE-001 | integration | path validation |
| `list_case_sources` | cases | `list_case_sources` | implemented | REQ-CASE-001 | integration | — |
| `count_directory_files` | ingest | `count_directory_files` | implemented | REQ-INGEST-001 | integration | — |
| `scan_directory` | ingest | `scan_directory` | implemented | REQ-INGEST-001 | integration | bounded scan |
| `ingest_files_to_case` | ingest | `ingest_files_to_case` | implemented | REQ-INGEST-001 | perf, integration | concurrency cap |
| `load_case_files` | ingest | `load_case_files` | implemented | REQ-INGEST-001 | integration | — |
| `load_case_files_with_inventory` | ingest | `load_case_files_with_inventory` | implemented | REQ-INGEST-001 | e2e | — |
| `sync_case_all_sources` | ingest | `sync_case_all_sources` | implemented | REQ-INGEST-001 | integration | cancel support |
| `refresh_single_file` | ingest | `refresh_single_file` | implemented | REQ-INGEST-001 | integration | — |
| `refresh_files_bulk` | ingest | `refresh_files_bulk` | implemented | REQ-INGEST-001 | perf | bounded |
| `check_file_changed` | files | `check_file_changed` | implemented | REQ-VIEW-001 | integration | — |
| `create_note` | artifacts | `create_note` | implemented | REQ-ARTIFACT-001 | integration | — |
| `list_notes` | artifacts | `list_notes` | implemented | REQ-ARTIFACT-001 | integration | — |
| `update_note` | artifacts | `update_note` | implemented | REQ-ARTIFACT-001 | integration | — |
| `delete_note` | artifacts | `delete_note` | implemented | REQ-ARTIFACT-001 | integration | — |
| `toggle_note_pinned` | artifacts | `toggle_note_pinned` | implemented | REQ-ARTIFACT-001 | integration | — |
| `create_finding` | artifacts | `create_finding` | implemented | REQ-ARTIFACT-001 | integration | — |
| `list_findings` | artifacts | `list_findings` | implemented | REQ-ARTIFACT-001 | integration | — |
| `update_finding` | artifacts | `update_finding` | implemented | REQ-ARTIFACT-001 | integration | — |
| `delete_finding` | artifacts | `delete_finding` | implemented | REQ-ARTIFACT-001 | integration | — |
| `create_timeline_event` | artifacts | `create_timeline_event` | implemented | REQ-ARTIFACT-001 | integration | — |
| `list_timeline_events` | artifacts | `list_timeline_events` | implemented | REQ-ARTIFACT-001 | integration | — |
| `update_timeline_event` | artifacts | `update_timeline_event` | implemented | REQ-ARTIFACT-001 | integration | — |
| `delete_timeline_event` | artifacts | `delete_timeline_event` | implemented | REQ-ARTIFACT-001 | integration | — |
| `search_files` | search | `search_files` | implemented | REQ-SEARCH-001 | integration | FTS sanitize |
| `search_notes` | search | `search_notes` | implemented | REQ-SEARCH-001 | integration | FTS sanitize |
| `search_all` | search | `search_all` | implemented | REQ-SEARCH-001 | integration | query bounds |
| `read_file_text` | files | `read_file_text` | implemented | REQ-VIEW-001 | security | case roots |
| `write_file_text` | files | `write_file_text` | implemented | REQ-VIEW-001 | security | case roots |
| `read_file_base64` | files | `read_file_base64` | implemented | REQ-VIEW-001 | integration | case roots |
| `open_file` | files | `open_file` | implemented | REQ-VIEW-001 | e2e | opener plugin |
| `rename_file` | files | `rename_file` | implemented | REQ-SEC-001 | security | confirm |
| `remove_file_from_case` | files | `remove_file_from_case` | implemented | REQ-SEC-001 | security | confirm |
| `update_file_status` | files | `update_file_status` | implemented | REQ-REVIEW-001 | integration | — |
| `find_duplicate_files` | duplicates | `find_duplicate_files` | implemented | REQ-INGEST-001 | integration | — |
| `mark_duplicate_primary` | duplicates | `mark_duplicate_primary` | implemented | REQ-INGEST-001 | integration | confirm |
| `merge_duplicate_metadata` | duplicates | `merge_duplicate_metadata` | implemented | REQ-SEC-001 | integration | audit |
| `start_timer` | billing | `start_timer` | implemented | REQ-TIME-001 | integration | — |
| `stop_timer` | billing | `stop_timer` | implemented | REQ-TIME-001 | integration | — |
| `pause_timer` | billing | `pause_timer` | implemented | REQ-TIME-001 | integration | — |
| `resume_timer` | billing | `resume_timer` | implemented | REQ-TIME-001 | integration | — |
| `get_time_entries` | billing | `get_time_entries` | implemented | REQ-TIME-001 | integration | — |
| `calculate_billing_amount` | billing | `calculate_billing_amount` | implemented | REQ-TIME-001 | unit | — |
| `get/save_*_config_db` | config | various | implemented | REQ-CASE-001 | unit | schema validate |
| `extract_file_metadata` | ingest | `extract_file_metadata` | implemented | REQ-INGEST-001 | integration | — |
| `run_ocr_preview` | ai | `run_ocr_preview` | stub | REQ-AI-001 | — | AI phase |
| `generate_case_report` | reports | `generate_case_report` | implemented | REQ-REPORT-001 | e2e | narrative template |
| `export_case_report` | reports | `export_case_report` | implemented | REQ-REPORT-001 | e2e | 5 export kinds |

See [spec/commands-and-contracts.md](spec/commands-and-contracts.md) and [spec/gap-analysis-backend.md](spec/gap-analysis-backend.md).
