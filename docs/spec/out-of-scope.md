# Out of Scope (Launch)

Explicit exclusions to prevent scope creep. Items may move to P1/P2 with decision record.

## Product

- Multi-user collaboration, shared cases, comments/@mentions
- Enterprise RBAC, SSO, audit export to SIEM
- Cloud-primary SaaS workspace (desktop remains primary)
- Mobile clients
- Real-time co-editing on notes

## Features

- Full kanban DnD board (table-first for P0)
- Mapping wizard / column manager (P1 unless blocker)
- In-app PDF.js stack (P1; external open OK for P0)
- Office in-app preview (Word/Excel) — P1
- OCR production pipeline — AINative
- AI auto-execute on destructive ops — never
- Team billing / multi-rate cards
- Cloud URI ingest (`s3://`, `gs://`) — defer
- Updater auto-install without signing proof — defer

## Technical

- `tauri-plugin-sql` dual stack — sqlx only in v2
- Porting v1 monolithic `lib.rs` structure
- JSON file store as production persistence
- Copying unused v1 Rust deps (`calamine`, `symphonia/all`)

## AI (entire phase deferred until Core Parity gate)

- Document summaries, entity extraction, synthesis, report AI draft, auto-triage, billing narrative assist

See [ai-capability-matrix.md](ai-capability-matrix.md) for post-gate AI scope.

## Decision record

Changes to this list require DR entry in [discovery-appendix.md](discovery-appendix.md) and README/readiness sync.
