# UI Port Plan (v1 → v2)

Continuation plan after **Core Parity backend gate** passed locally. Backend commands, SQLite/FTS, parity, and hardening suites are complete; **UX parity with v1 is the active workstream**. AINative remains blocked until the **UX Parity Build Gate** passes.

**v1 reference:** `/Users/tyler/projects/malissa_projects/inventory-generator`  
**v2 target:** `apps/desktop` (Next.js + Tauri shell via `apps/desktop-backend`)

## Executive status (2026-05-21)

| Track | Status |
|-------|--------|
| Backend Core Parity | **PASS** — [command-parity-ledger.md](command-parity-ledger.md), `pnpm test:parity`, `pnpm test:hardening` |
| UI foundation + case hub | **implemented** — design tokens, shadcn primitives, `CaseListView`, dialogs |
| UI workspace + viewers + panels | **planned** — legacy `case-workspace.tsx` is functional only |
| AINative | **blocked** — until UX Parity Build Gate |

## Local development (canonical)

| Command | Use |
|---------|-----|
| `pnpm dev` | Full desktop (Tauri + Next on :3000 + Rust) |
| `pnpm dev:ui` | Browser-only Next (`dev:next`); no native APIs |
| `pnpm dev:web` | Marketing site (:3001) |
| `pnpm dev:all` | Web + Tauri desktop + `@repo/ui` watchers (no duplicate Next on :3000) |

See [README.md](../README.md).

## Completed phases

### Phase U1 — Foundation ✅

- OKLCH design system in `apps/desktop/app/globals.css` (ported from v1)
- `lib/utils.ts`, `lib/date-utils.ts`, `lib/tauri-dialog.ts`
- `ThemeProvider`, `AppProviders`, `ErrorBoundary`, `SplashScreen`, `ThemeToggle`
- `@/` path alias; Montserrat via `app/layout.tsx`
- Radix/shadcn primitive set under `components/ui/*` (22 components)

### Phase U2 — Primitives ✅

Button, card, input, textarea, label, dialog, alert-dialog, dropdown, context-menu, popover, select, command, scroll-area, tooltip, toast + `use-toast`, badge, checkbox, radio-group, separator, calendar, progress, alert, skeleton.

### Phase U3 — Case-first shell ✅

| v1 | v2 (actual path) | Notes |
|----|------------------|-------|
| `CaseListView` | `components/case/case-list-view.tsx` | Search, sort, grid/list, recent section |
| `CaseListCard` | `components/case/case-list-card.tsx` | |
| `CreateCaseDialog` | `components/case/create-case-dialog.tsx` | Tauri folder/file pickers |
| `DeleteCaseConfirmationDialog` | `components/case/delete-case-confirmation-dialog.tsx` | |
| `CaseListViewMode` | `components/case/case-list-view-mode.tsx` | |
| App routing | `app/page.tsx` → hub; `app/case/page.tsx` → workspace | Query param `?id=` (static export) |

**Deferred from v1 hub (Phase U3 tail):** `EditCaseDialog`, `CaseFilters`, `LargeFolderWarningDialog` — needs backend case metadata fields (`caseId`, `department`, `client`) and/or `count_directory_files` wiring.

## Active / next phases

### Phase U4 — Workspace shell ✅

`case-workspace-shell.tsx`, resizable layout, navigator, split/board, ingest/sync (see ingest section below).

### Phase U5 — Viewers ✅ (elite router; no heavy PDF/Office deps yet)

| Component | Path |
|-----------|------|
| Preview router | `lib/file-preview.ts` + `components/viewer/file-viewer.tsx` |
| Image / text / markdown / CSV | `components/viewer/*-file-preview.tsx` |
| External (PDF, Office, etc.) | `components/viewer/external-file-preview.tsx` + `lib/open-file.ts` |

### Phase U6 — Artifact panels ✅ (MVP)

| Panel | Path |
|-------|------|
| Notes | `components/artifacts/notes-panel.tsx` |
| Findings | `components/artifacts/findings-panel.tsx` |
| Timeline | `components/artifacts/timeline-panel.tsx` |

Tiptap rich editor and duplicate UI remain P1/U7+.

### Phase U7+ — Next

| Viewer | Deps | Priority |
|--------|------|----------|
| Text / markdown | Tiptap read-only | P0 |
| Image | existing base64 path | P0 |
| CSV | custom table | P0 |
| PDF | `@react-pdf-viewer/*` | P1 |
| DOCX | `mammoth` | P1 |
| XLSX | `xlsx-js-style` | P1 |
| `MetadataPanel`, `FileChangeWarning` | — | P0 |

### Phase U6 — Artifact panels

- `NotePanel` + Tiptap editor, `CreateNoteDialog`
- `FindingsPanel`, `CreateFindingDialog`
- `TimelineView`, `CreateTimelineEventDialog`
- Duplicate panels (`DuplicateManagementPanel`, etc.) — P1

### Phase U7 — Board / review

- Workflow board or simplified swimlane table with `@dnd-kit`
- Status cells, column manager (config commands exist)

### Phase U8 — Time management

- `TimerWidget`, `TimeManagementPage`, calendar day UI, segment edit, billing config dialogs

### Phase U9 — Reports UI

- `ReportView`, `ReportSections` wired to `export_case_report` / `generate_case_report`

### Phase U10 — Search + settings

- `SearchDialog` (cmdk), result groups, search viewer
- `SettingsDialog`, mapping UI (P1), `ColumnManager`

### Phase U11 — UX gate + cleanup

- Remove `components/case-workspace.tsx` legacy shell
- Manual E2E pass on v1 flow map ([spec/user-flow-map.md](spec/user-flow-map.md))
- `pnpm ops:validate:local` after UI milestones
- Update [desktop-workflow-mapping.md](desktop-workflow-mapping.md), [readiness.md](readiness.md), feature catalog statuses

## UX Parity Build Gate (target)

All must pass before AINative:

| # | Criterion |
|---|-----------|
| U1 | Case hub matches v1 outcomes (list, create, open, delete, search/sort) |
| U2 | Workspace: navigator + viewer + toggleable notes/findings/timeline panels |
| U3 | File review status workflow + ingest/sync from header |
| U4 | Global search dialog (cmdk) with FTS-backed results |
| U5 | Timer widget + time management entry |
| U6 | Report mode with five export types |
| U7 | Theme (light/dark/system), splash, error boundary in all routes |
| U8 | No `invoke()` in components; adapters only |
| U9 | `pnpm dev` smoke: full Tauri path for primary flows |

Backend regression: `pnpm test:parity` + `pnpm test:hardening` remain required on every UI merge.

## Backend gaps for full v1 hub parity (optional Phase U3 tail)

Extend `CaseSummary` / SQLite `cases` table for: `caseId`, `department`, `client`, `deployment_mode`, `last_opened_at` if product requires v1 card fidelity. Until then, hub UI omits those badges/filters.

## Ingest / sync / dedup (implemented core)

| Capability | Status |
|------------|--------|
| Multiple folder and file sources | done — create + **Add folders or files** in workspace |
| Per-source ingest (`ingest.rs`) | dir walk or single file; relative `folder_path` |
| Incremental sync | skip unchanged; update on change; rename-by-hash |
| Duplicate groups (SHA-256) | rebuild `duplicate_groups` each ingest |
| Orphan cleanup | soft-delete when missing from source and no file notes |
| Auto-sync | default 5 min; toggle in header ⋮ menu |
| Duplicate UI / merge decisions | pending — commands exist; panel in U6+ |

## Related docs

- [desktop-workflow-mapping.md](desktop-workflow-mapping.md)
- [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md)
- [spec/user-flow-map.md](spec/user-flow-map.md)
- [implementation-readiness-gate.md](implementation-readiness-gate.md)
