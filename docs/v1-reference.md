# CaseSpace v1 Reference

Canonical reference for v1 (`/Users/tyler/projects/malissa_projects/inventory-generator`) during the v2 rebuild.

**Important:** v1 is a **React/Vite + Tauri 2** desktop app (not Next.js). Preserve product **outcomes** in v2; redesign implementation.

**v2 port status:** see [command-parity-ledger.md](command-parity-ledger.md) and [spec/gap-analysis-master.md](spec/gap-analysis-master.md). v2 does **not** yet have v1 parity.

## Product intent to preserve

From v1 `docs/GAPS_ANALYSIS.md`:

> No more Word docs, Excel sheets, digging through files and folders, needing special software to open different file types, and manual analyzing and writing long, tedious reports.

Core user outcomes delivered in v1:

- Case-centric workflow (not folder-centric workflow)
- High-throughput document inventory ingestion
- Integrated multi-format file viewing
- Search, discovery, and duplicate management
- Notes, findings, timeline, and billing/time tracking in one workspace

## v1 architecture summary

- UI: React + Vite + TypeScript (desktop-only)
- Native: Tauri 2 + Rust command layer
- Data: SQLite + FTS5 search
- Pattern: Frontend services invoke backend commands through Tauri IPC

## v1 capability inventory

### Fully implemented in v1

- Case CRUD + multi-source case management
- Recursive scan + inventory sync + metadata extraction
- Notes, findings, timeline CRUD
- FTS5 search across files and related entities
- Duplicate discovery and merge workflows
- Time tracking and billing workflows
- Integrated file viewer (PDF, image, text/code, CSV/doc pathways)

### Partial / roadmap in v1

- AI-assisted report generation
- OCR and auto-extraction automation
- Deeper automated summarization/labeling

## Command domains (v1)

Main command groups exposed by `src-tauri/src/lib.rs` and `src-tauri/src/time_tracking.rs`:

- Cases: create/list/get/update/delete + source management
- Inventory: scan/sync/refresh/status flows
- Content: notes/findings/timeline CRUD
- Search: `search_files`, `search_notes`, `search_all`
- File operations: open/read/write/rename
- Duplicates: detect/group/merge/mark-primary
- Config: column/mapping/system/workspace preferences
- Time: timer lifecycle, entries, segments, billing config and calculations

## Database domain reference (v1)

Primary tables/domains represented in v1 schema:

- Case data: `cases`, `case_sources`
- File and inventory data: `files`, `file_metadata`
- Analyst artifacts: `notes`, `findings`, `timeline_events`
- Duplicate control: `duplicate_groups`
- Preferences/config: `column_configs`, `mapping_configs`, `app_settings`, `workspace_preferences`
- Billing/time: `time_entries`, `time_segments`, `case_billing_config`, `active_timers`
- Migration metadata: `_migrations`

FTS virtual tables exist for key text search surfaces and are part of expected query behavior.

## Component/system areas (v1 UI)

Major feature directories:

- `components/case`, `components/workspace`, `components/viewer`
- `components/notes`, `components/findings`, `components/timeline`
- `components/search`, `components/duplicates`, `components/time`
- `components/reports`, `components/mapping`, `components/ui`

Service and state hotspots:

- `src/services/*` command adapters and client orchestration
- `src/hooks/*` workflow orchestration
- `src/store/*` global state

## Security and risk notes to carry forward

- File-system touching commands require strict path validation and permission scoping.
- Destructive operations (delete, rename, merge, remove) need explicit safeguards and auditability.
- Search inputs must remain sanitized and bounded.
- Capability configuration should trend narrower, never wider, unless explicitly justified.

## v1 docs index to port or summarize

Priority docs from v1:

- `README.md`
- `docs/architecture.md`
- `docs/codebase-overview.md`
- `docs/GAPS_ANALYSIS.md`
- `docs/STYLE_GUIDE.md`
- `docs/TESTING.md`
- `docs/DEVELOPMENT.md`
- `docs/RELEASE_SETUP.md`

Porting policy:

- Port decision-critical architecture and quality docs first.
- Summarize historical roadmap docs where full carryover is unnecessary.
- Keep direct links to v1 paths in migration docs until equivalent v2 docs exist.
