# Performance, Security, and Reliability Gates

Non-functional requirements for CoreParity and AINative phases.

## Performance targets (draft — calibrate on reference hardware)

| Metric | Target (draft) | Requirement | Gate |
|--------|----------------|-------------|------|
| Ingest throughput | ≥ 500 files/min (local SSD, M-series 16GB) | REQ-INGEST-001 | perf |
| Case open (10k files) | p95 < 2s load metadata | REQ-INGEST-001 | perf |
| FTS search | p95 < 300ms for typical query | REQ-SEARCH-001 | perf |
| Viewer open (text) | p95 < 500ms | REQ-VIEW-001 | perf |
| Report generation | p95 < 10s non-AI aggregate | REQ-REPORT-001 | perf |

Reference hardware TBD in discovery; document in readiness when locked.

## Security gates

| Control | Implementation | Test |
|---------|----------------|------|
| Path traversal block | `is_path_string_safe` + canonicalize + case roots | unit, security |
| Case-scoped I/O | All file commands require `case_id` | integration |
| FTS injection | `sanitize_fts_query` equivalent | unit |
| Destructive confirm | UI + command audit | e2e |
| CSP (Tauri webview) | Non-null CSP before prod ship | manual + e2e |
| PII cloud policy | redacted-cloud default; per-case toggle | config test |

## Reliability gates

| Control | Requirement |
|---------|-------------|
| Atomic DB writes | Transactions for ingest + timer |
| No silent store reset | Fail on corrupt DB with user-visible error |
| WAL mode | SQLite WAL enabled |
| Cancel ingest | User can cancel long ingest |
| Offline core | Case open, review, notes work without network |

## AI runtime tiers (AINative phase)

| Tier | Meaning | Examples |
|------|---------|----------|
| local-required | Never leaves device | Path validation, timer, local index |
| local-preferred | Try local SLM first | Quick summaries on small docs |
| redacted-cloud-default | Minimized payload to cloud | Entity extract, synthesis |
| raw-cloud-opt-in | Full content with consent | Complex narrative draft |

Per-case policy toggle; default **redacted-cloud**.

## Risk → control → validation

| Risk | Control | Validation |
|------|---------|------------|
| Data loss on crash | WAL + transactions | integration crash recovery |
| Cross-case leakage | Clear state on case close | e2e |
| Billable time lost | Timer auto-stop on switch | e2e |
| Unauthorized file access | Root validation | security suite |
| AI hallucination in report | Human approve export | e2e |

## Phase gating

- CoreParity: all security gates + draft perf targets for P0 flows
- AINative: no regression on CoreParity perf; AI quality harness added
