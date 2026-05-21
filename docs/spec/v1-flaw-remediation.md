# v1 Flaw Remediation Map

Known v1 weaknesses that must **not** be recreated in v2. Each item has a v2 remediation strategy.

| Flaw ID | v1 issue | v2 remediation | Requirement |
|---------|----------|----------------|-------------|
| FLAW-001 | Monolithic 3900-line `lib.rs` | Domain modules `commands/*`, `domain/*`, `persistence/*` | REQ-CASE-001 |
| FLAW-002 | Some file commands use global path without case scope | Case-root validation on all file I/O | REQ-SEC-001 |
| FLAW-003 | `sync_inventory` client-merge anti-pattern | DB-centric ingest/sync | REQ-INGEST-001 |
| FLAW-004 | Mega UI components (viewer 1800+ lines) | Composable viewer modules | REQ-VIEW-001 |
| FLAW-005 | Enterprise case list filters at launch | Solo-simple list + search | UX simplification |
| FLAW-006 | `tauri-plugin-sql` + sqlx confusion | sqlx-only migrations | data model |
| FLAW-007 | MD5 + SHA256 dual hash | SHA-256 canonical | REQ-INGEST-001 |
| FLAW-008 | Incomplete remeta/video metadata | Defer or minimal feature set | out-of-scope |
| FLAW-009 | Updater placeholder keys in config | No updater until signing ready | release |
| FLAW-010 | v2 JSON store silent corrupt reset | SQLite + fail-closed errors | REQ-INGEST-001 |

## Anti-patterns checklist (code review)

- [ ] No new commands in UI components (adapter only)
- [ ] No `invoke` without case_id for file ops
- [ ] No full-store JSON rewrite without transaction
- [ ] No AI auto-write to disk or DB without confirm
- [ ] No substring search as production search
