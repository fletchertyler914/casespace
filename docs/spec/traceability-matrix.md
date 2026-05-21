# Traceability Matrix

`FlowStep → Feature → Command/API → DataModel → UI Surface → Test Suite`

## P0 CoreParity rows

| FlowStep | Feature | Command/API | DataModel | UI Surface | Test Suite |
|----------|---------|-------------|-----------|------------|------------|
| Create case | F-CASE-01 | `create_case` | cases, case_sources | Case hub dialog | integration |
| Open case | F-CASE-01 | `load_case_files_with_inventory` | files | Workspace shell | e2e |
| Ingest | F-INGEST-01 | `ingest_files_to_case` | files, file_metadata | Progress + navigator | perf, integration |
| Preview file | F-VIEW-01 | `read_file_text` | files | Viewer pane | e2e |
| Set status | F-REVIEW-01 | `update_file_status` | files | Status control | integration |
| Create note | F-NOTE-01 | `create_note` | notes | Notes panel | integration |
| Create finding | F-FIND-01 | `create_finding` | findings | Findings panel | integration |
| Timeline event | F-TIME-01 | `create_timeline_event` | timeline_events | Timeline panel | integration |
| Search | F-SEARCH-01 | `search_all` | FTS indexes | Command palette | integration, e2e |
| Export report | F-REPORT-01 | report export API | cases, artifacts, files | Reports view | e2e |
| Start timer | F-BILL-01 | `start_timer` | time_entries | Header timer | integration |
| Stop timer | F-BILL-01 | `stop_timer` | time_entries | Header timer | e2e |
| Billing export | F-BILL-04 | billing export | time_entries, billing_config | Billing export | integration |

## Risk traceability

| Risk | Control | Validation |
|------|---------|------------|
| Path escape | case-root validation | security, unit |
| Data loss | WAL + transactions | integration |
| Cross-case leak | clear state on close | e2e |
| Bad AI report | human approve (AI phase) | e2e |

See [perf-security-reliability-gates.md](perf-security-reliability-gates.md).

## AI-phase rows (deferred)

| FlowStep | Feature | Command/API | DataModel | UI Surface | Test Suite |
|----------|---------|-------------|-----------|------------|------------|
| Summarize doc | F-AI-01 | `ai_summarize_document` (planned) | file_metadata | Viewer AI panel | integration |
| Draft report | F-AI-04 | `ai_draft_report_section` (planned) | report_drafts | Reports view | e2e |

Command names are placeholders until AINative phase.
