# CaseSpace v2 Readiness

Tracks implemented scope, validated scope, and gates required before production sign-off and AI enablement.

**Last updated:** 2026-05-21 (post evidence-based source re-audit — earlier UX "done" claims were overstated; see [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md))

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — [product-spec-bible.md](product-spec-bible.md) |
| Core Parity **backend** | **Complete (local)** — SQLite, FTS, P0 commands, parity + hardening suites |
| Core Parity **UX** (v1 port) | **Shallow MVP only** — estimated ~30–40% of v1 user-flow surface. Big gaps: no inventory data grid, no metadata panel, no viewer rename/delete, broken global search, plain-text notes/findings/timeline, shallow duplicates resolution, shallow time/billing, markdown-only reports, no mapping/column UI. See [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md) |
| Toolchain | Next **16.2.6** catalog-pinned; `minimumReleaseAge` 48h |
| AINative phase | **Blocked** — until UX Parity Build Gate (not yet earned) |
| Production distribution | **Blocked** — no `tauri-plugin-updater`, no Developer ID / Windows signing, no notarization. macOS ad-hoc signing only (works for manual install w/ Gatekeeper bypass) |
| Remote CI evidence | Partial — push for fresh CI on Node 24 |

## Documentation map (source of truth)

| Document | Purpose |
|----------|---------|
| [product-spec-bible.md](product-spec-bible.md) | Requirements and phase partitioning |
| [ui-port-plan.md](ui-port-plan.md) | **Active** — UI port phases U1–U11 and UX gate |
| [implementation-readiness-gate.md](implementation-readiness-gate.md) | Planning / backend / UX / AI gates |
| [command-parity-ledger.md](command-parity-ledger.md) | v1 ↔ v2 commands (backend) |
| [desktop-workflow-mapping.md](desktop-workflow-mapping.md) | v1 UI → v2 component map |
| [persistence-mapping.md](persistence-mapping.md) | SQLite target schema |
| [spec/gap-analysis-master.md](spec/gap-analysis-master.md) | Executive gap summary |

## Readiness matrix

| Area | Ready now | Not ready yet |
|------|-----------|---------------|
| Monorepo foundation | pnpm + Turbo + arch guard; catalog-pinned Next | Remote CI green on Node 24 after next push |
| Desktop backend | Full non-AI command matrix + SQLite/FTS + ingest v2 | AI-native commands; `commands/*` module split |
| Desktop UI | Case CRUD (create/list/open/delete), workspace shell, file navigator (folder tree), in-app viewer **routing** for 15 file categories with v1 extension parity, plain-text notes/findings/timeline CRUD, board with status DnD, workspace prefs dialog, MVP timer widget + time panel, MVP duplicates panel (list + set primary), MVP reports panel (markdown exports) | Inventory data grid; viewer metadata panel + rename/delete/file-change UI + fullscreen + keyboard nav; Tiptap rich-text artifact editors; deep duplicates resolution (comparison UI, decision dialog, badges, ingestion notification, fix merge-doesn't-relink-artifacts bug); time segment model + billing config UI; structured reports + PDF/DOCX; column/mapping config UI + Rust extraction engine; EditCaseDialog; ingest progress + cancellation; theme + system-file-filter settings UI; syntax-highlighted code viewer; image zoom/rotate/fullscreen; XLSX sheet tabs + header detection; markdown rendered (not raw); **search dialog runtime fix** (broken now: `search_all` shape mismatch) |
| Web surface | Marketing + download page | Content polish only |
| Shared packages | `@repo/types` contracts (partial) | Full DTO parity + adapter envelopes |
| Documentation | Spec pack + port plan synced to code | Feature catalog row-by-row as U7–U10 land |
| Quality system | `ops:validate:local`, parity, hardening | UX E2E oracles ([test-oracle-matrix](spec/test-oracle-matrix.md)) |
| Toolchain | Node 24, Next 16.2.6 pin, lockfile + frozen CI install | Live release multi-arch proof |

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Implementation Readiness (planning) | **PASS** | [implementation-readiness-gate.md](implementation-readiness-gate.md) |
| Core Parity **backend** Build Gate | **PASS (local)** | C1–C7 below |
| UX Parity Build Gate | **NOT EARNED** — claim retracted after evidence-based re-audit. Earliest realistic pass: after the file table, viewer metadata/rename/delete, broken search fix, duplicates depth, and Tiptap notes/findings land. See [spec/gap-analysis-master.md](spec/gap-analysis-master.md) critical path |
| Production distribution Gate | **NOT EARNED** — updater, Developer ID + Windows signing, notarization all missing |

### Core Parity backend (passed)

| # | Criterion | Status |
|---|-----------|--------|
| C1 | P0 non-AI workflows (backend/integration) | **validated** — `pnpm test:parity`, `pnpm test:hardening` |
| C2 | P0 commands per ledger | **validated** |
| C3 | SQLite replaces JSON store | **validated** |
| C4 | FTS search | **validated** |
| C5 | Report + billing exports (commands) | **validated** |
| C6 | No critical P0 defects in parity suite | **validated** |
| C7 | Evidence in this doc | **validated** |

## Execution order (locked)

1. Finish **UX port** U7–U11 on elite architecture
2. Pass **UX Parity Build Gate** + manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md)
3. **AINative** per [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md)
4. Release/prod proof via `pnpm release:validate` when cutting release

## Validation evidence

| Run | Date | Command | Result |
|-----|------|---------|--------|
| Parity integration | 2026-05-21 | `pnpm test:parity` | **pass** |
| Hardening suite | 2026-05-21 | `pnpm test:hardening` | **pass** |
| Local validate stack | 2026-05-21 | `pnpm ops:validate:local` | **pass** (when last run) |
| Desktop UI lint/types/build | 2026-05-21 | `pnpm --filter desktop lint/check-types/build` | **pass** |

*Update this table after each validation run.*

## Immediate next execution (re-prioritized from honest audit)

Listed in dependency order. See [spec/gap-analysis-master.md](spec/gap-analysis-master.md) "Launch critical path (rewritten)" for full detail and rough sizings.

1. **Fix broken global search** — `search_all` Rust shape vs UI contract (half-day)
2. **Fix `merge_duplicate_metadata`** — actually relink notes/findings/timeline to primary (half-day)
3. **Viewer header parity** — RenameFileDialog, DeleteFileDialog, MetadataPanel, FileChangeWarning (wire to existing backend commands) (1–2 days)
4. **Inventory data grid** — the single biggest UX gap; full columns/sort/filter/bulk/multi-select/inline edit (4–6 days)
5. **Tiptap rich notes / findings / timeline** — replace plain textareas; add CreateNoteDialog/CreateFindingDialog/CreateTimelineEventDialog with date picker + event types + severity + linked files (3–4 days)
6. **Duplicates depth** — DuplicateManagementPanel, DuplicateDecisionDialog, badges across navigator+viewer (3 days)
7. **Time / billing depth** — segment model in Rust + SegmentEditDialog/DailySummaryDialog/BillingConfigDialog/DeleteTimeEntryDialog + list/calendar views + batch update (5–7 days)
8. **Reports depth** — structured section model + preview + PDF/DOCX exports + persistent history (3–4 days)
9. **Column / mapping config** — port ColumnManager + FieldMapperStepper + implement Rust extraction engine (5–8 days)
10. **EditCaseDialog** + rename in case list (half-day)
11. **App SettingsDialog** — theme + system-file-filter (1 day; add the missing Rust commands too)
12. **Ingest UX** — progress bar, cancellation, LargeFolderWarningDialog, DuplicateIngestionNotification (2–3 days)
13. **Frontend unit tests** — vitest setup; start with command-client + file-preview + viewer routing (ongoing)
14. **Updater + production signing** — distinct workstream once paid Apple/Windows certs are in place

Keep `pnpm test:parity` + `pnpm test:hardening` on every merge. Bump Next via `pnpm-workspace.yaml` catalog only (review lockfile diff).

## What should wait

- AINative features
- Team collaboration
- v1 DB import tool (P1)
- Mapping/settings sprawl beyond P0 (P1)
