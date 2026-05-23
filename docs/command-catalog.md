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
| `generate_case_report` | reports | implemented | REQ-REPORT-001 — accepts optional `templateId`; returns JSON `ReportDocument` |
| `generate_ai_case_report` | reports / agents | implemented locally | REQ-REPORT-001 / Agent C2 — accepts optional `templateId`; requires user AI provider key from OS keychain or env fallback; returns citation-backed JSON `ReportDocument` |
| `extract_file_text` | ai / ingest | implemented locally | Schema v8 — per-file text extraction with OCR fallback |
| `extract_case_text` | ai / ingest | implemented locally | Batch extract; emits `text-extract-progress` events |
| `get_ai_settings` | ai / settings | implemented locally | Returns AI key availability/source plus model and base URL; never returns the API key |
| `save_ai_settings` | ai / settings | implemented locally | Saves API key to OS keychain and model/base URL to `app_settings` |
| `clear_ai_api_key` | ai / settings | implemented locally | Removes the keychain-stored AI provider key |
| `test_ai_connection` | ai / settings | implemented locally | Tests the configured OpenAI-compatible endpoint and returns status/latency |
| `analyze_file_with_ai` | ai | implemented locally | Per-file finding/timeline/entity draft generation |
| `analyze_case_with_ai` | ai | implemented locally | Corpus dedupe/merge pass over pending finding drafts |
| `list_ai_drafts` | ai | implemented locally | Returns pending finding/timeline/entity drafts |
| `approve_ai_finding_draft` | ai | implemented locally | Persists approved draft → `findings` row |
| `reject_ai_finding_draft` | ai | implemented locally | Marks draft rejected |
| `approve_ai_timeline_draft` | ai | implemented locally | Persists approved draft → `timeline_events` row |
| `reject_ai_timeline_draft` | ai | implemented locally | Marks draft rejected |
| `approve_ai_entity_draft` | ai | implemented locally | Marks entity draft approved (audit trail) |
| `reject_ai_entity_draft` | ai | implemented locally | Marks draft rejected |
| `count_approved_ai_findings` | ai | implemented locally | Badge count for reports workspace |
| `get_report_draft` | reports | implemented locally | Returns persisted `ReportDraft` for case+template or null |
| `save_report_draft` | reports | implemented locally | Full draft upsert (autosave) |
| `update_report_section` | reports | implemented locally | Patch single section text + status |
| `regenerate_report` | reports | implemented locally | AI regen with scope `all` / `unreviewed` / `section`; never overwrites `edited`/`locked` |
| `generate_and_save_report_draft` | reports | implemented locally | First-draft generation + persist |
| `create_report_snapshot` | reports | implemented locally | Named snapshot of draft |
| `list_report_snapshots` | reports | implemented locally | Snapshot history |
| `restore_report_snapshot` | reports | implemented locally | Restore draft from snapshot |
| `export_report_markdown` | reports | implemented locally | Markdown string export |
| `export_report_docx` | reports | implemented locally | DOCX write via `docx-rs` + save path |
| `get_examiner_profile` | reports | implemented locally | Singleton examiner boilerplate |
| `save_examiner_profile` | reports | implemented locally | Upsert examiner profile |
| `run_report_compliance_scan` | reports | implemented locally | Language scan + required sections + persona completeness |
| `seed_sample_fraud_case` | cases | implemented | PMF demo — seeds sample fraud examination case |
| `export_case_report` | reports | implemented | REQ-REPORT-001 |
| `run_ocr_preview` | ai | implemented locally | REQ-AI-001 — delegates to text extractor; image OCR routes through BYOK vision-LLM (preview capped at 4k chars) |
| `get_ai_settings` / `save_ai_settings` / `clear_ai_api_key` / `test_ai_connection` | ai | implemented locally | BYOK AI provider settings (OS keychain + app_settings); see `ai_settings.rs` |

See [spec/commands-and-contracts.md](spec/commands-and-contracts.md).
