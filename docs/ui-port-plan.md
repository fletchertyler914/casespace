# UI Port Plan (v1 → v2)

Continuation plan after **Core Parity backend gate** passed locally. Backend commands, SQLite/FTS, parity, and hardening suites are complete; **UX parity with v1 is the active workstream**. AINative remains blocked until the **UX Parity Build Gate** passes.

**v1 reference:** `/Users/tyler/projects/malissa_projects/inventory-generator`  
**v2 target:** `apps/desktop` (Next.js + Tauri shell via `apps/desktop-backend`)

## Executive status (2026-05-21)

| Track | Status |
|-------|--------|
| Backend Core Parity | **PASS** — [command-parity-ledger.md](command-parity-ledger.md), `pnpm test:parity`, `pnpm test:hardening` |
| UI foundation + case hub (U1–U3) | **implemented** |
| Workspace + ingest/sync (U4) | **implemented** |
| Viewers (U5) | **implemented** — in-app PDF/DOCX/XLSX; external only for unsupported types |
| Artifact panels (U6) | **MVP implemented** — notes/findings/timeline list+create; rich editors deferred |
| U7 duplicates + board | **in progress** — duplicates panel MVP shipped; board/dnd pending |
| U8 time | **in progress** — timer widget MVP shipped |
| U9 reports | **next** |
| U10 search | **in progress** — cmdk search dialog shipped; settings pending |
| UX gate + legacy cleanup (U11) | **pending** |
| AINative | **blocked** — until UX Parity Build Gate |
| Toolchain | Next **16.2.6** pinned via pnpm catalog — see [Supply chain](#supply-chain) |

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

- OKLCH design system in `apps/desktop/app/globals.css`
- `lib/utils.ts`, `lib/date-utils.ts`, `lib/tauri-dialog.ts`, `lib/binary-from-base64.ts`
- `ThemeProvider`, `AppProviders`, `ErrorBoundary`, `SplashScreen`, `ThemeToggle`
- `@/` path alias; Montserrat via `app/layout.tsx`
- shadcn primitives under `components/ui/*` (22 components)

### Phase U2 — Primitives ✅

Button, card, input, textarea, label, dialog, alert-dialog, dropdown, context-menu, popover, select, command, scroll-area, tooltip, toast + `use-toast`, badge, checkbox, radio-group, separator, calendar, progress, alert, skeleton.

### Phase U3 — Case-first shell ✅

| v1 | v2 | Notes |
|----|-----|-------|
| `CaseListView` | `components/case/case-list-view.tsx` | Search, sort, grid/list |
| `CaseListCard` | `components/case/case-list-card.tsx` | |
| `CreateCaseDialog` | `components/case/create-case-dialog.tsx` | Tauri folder/file pickers |
| `DeleteCaseConfirmationDialog` | `components/case/delete-case-confirmation-dialog.tsx` | |
| `CaseListViewMode` | `components/case/case-list-view-mode.tsx` | |
| Routing | `app/page.tsx` hub; `app/case/page.tsx` workspace | Query `?id=` (static export) |

**Deferred (U3 tail):** `EditCaseDialog`, `CaseFilters`, `LargeFolderWarningDialog` — needs case metadata fields and/or `count_directory_files`.

### Phase U4 — Workspace shell ✅

| Area | v2 path |
|------|---------|
| Shell | `components/workspace/case-workspace-shell.tsx` |
| Layout | `workspace-layout.tsx`, `split-view.tsx`, `file-navigator.tsx` |
| Header | `case-header.tsx` — sync, sources, auto-sync, panel toggles |
| Board stub | `board-view.tsx` |
| Viewer pane | `file-viewer-pane.tsx` |
| Paths | `lib/case-path-utils.ts` — relative tree roots |
| Hooks | `use-workspace-panels.ts`, `use-case-auto-sync.ts` |

**Ingest / sync / dedup (backend + UI):**

| Capability | Status |
|------------|--------|
| Multiple folder/file sources | done — create + add sources in workspace |
| Incremental sync | `sync_case_all_sources`; auto-sync (5 min, prefs in DB) |
| Relative `folder_path` | ingest + `relativizeCaseFiles()` |
| Duplicate groups (SHA-256) | rebuild on ingest; UI panel shipped (set primary), merge UX pending |
| Orphan cleanup | soft-delete when missing from source |

### Phase U5 — Viewers ✅

| Kind | Implementation |
|------|----------------|
| Router | `lib/file-preview.ts` → `components/viewer/file-viewer.tsx` |
| PDF | `pdf-file-preview.tsx` + `pdf-toolbar.tsx` + `pdf-viewer-theme.css` (`@react-pdf-viewer/*`, worker in `public/pdf.worker.min.js`) |
| DOCX/DOC | `docx-file-preview.tsx` (`mammoth`) |
| XLSX/XLS | `xlsx-file-preview.tsx` (`xlsx-js-style`) |
| Image / text / markdown / CSV | `*-file-preview.tsx` |
| Unsupported only | `external-file-preview.tsx` — PPT, archives, media, etc.; **Open** toolbar action only for these |

App theme drives PDF chrome (no in-viewer theme toggle). Custom toolbar: search, zoom, page nav, rotate, download, print.

**Deferred:** `MetadataPanel`, `FileChangeWarning`, Tiptap read-only markdown.

### Phase U6 — Artifact panels ✅ (MVP)

| Panel | Path | Scope |
|-------|------|-------|
| Notes | `components/artifacts/notes-panel.tsx` | List + create via `command-client` |
| Findings | `components/artifacts/findings-panel.tsx` | List + create |
| Timeline | `components/artifacts/timeline-panel.tsx` | List + create |

**Deferred:** Tiptap rich note editor, create dialogs (v1 parity), duplicate management UI.

### Phase U7 — Board + duplicates 🚧

- Duplicates panel implemented in split view (`components/artifacts/duplicates-panel.tsx`)
- Primary-file selection wired via `mark_duplicate_primary`
- Remaining: board drag/drop workflows, merge-duplicates UX, conflict resolution dialogs

### Phase U8 — Time management 🚧

- Timer widget MVP in header (`components/billing/timer-widget.tsx`) with start/stop + live elapsed
- Remaining: pause/resume UX, daily summary, segment editing, billing config dialogs

## Next phases (execution order)

### Phase U7 continuation — Board parity

- Workflow board or swimlanes with `@dnd-kit` (improve `board-view.tsx`)
- File review status polish in board/table
- Duplicate metadata merge UX (`merge_duplicate_metadata`) and safe confirmation flow

### Phase U8 continuation — Time parity

- Time management page, calendar day UI, segment edit, billing config

### Phase U9 — Reports UI

- `ReportView` wired to `export_case_report` / `generate_case_report` (five export types)

### Phase U10 — Search + settings

- `SearchDialog` (cmdk) + FTS-backed result groups
- `SettingsDialog`, column manager; mapping UI P1

### Phase U11 — UX gate + cleanup

- Delete legacy `components/case-workspace.tsx` (unused; shell is `case-workspace-shell.tsx`)
- Manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md)
- `pnpm ops:validate:local`
- Refresh [desktop-workflow-mapping.md](desktop-workflow-mapping.md), [spec/feature-catalog.md](spec/feature-catalog.md) row statuses

## UX Parity Build Gate (target)

All must pass before AINative:

| # | Criterion | Status |
|---|-----------|--------|
| G1 | Case hub: list, create, open, delete, search/sort | **done** |
| G2 | Workspace: navigator + viewer + notes/findings/timeline panels | **done** (panels MVP) |
| G3 | File review status + ingest/sync from header | **done** |
| G4 | In-app viewers for PDF/Office/spreadsheets + text/image/CSV | **done** |
| G5 | Global search dialog (cmdk) with FTS | pending U10 |
| G6 | Timer + time management entry | pending U8 |
| G7 | Report mode (five export types) | pending U9 |
| G8 | Duplicate review UI | pending U7 |
| G9 | Theme/splash/error boundary on all routes | **done** |
| G10 | No `invoke()` in components; `command-client` only | **done** |
| G11 | `pnpm dev` smoke on primary flows | validate at U11 |
| G12 | Backend regression suites on every merge | **ongoing** |

## Supply chain

- **Next.js** `16.2.6` (latest stable) pinned in `pnpm-workspace.yaml` `catalog:`; apps use `"next": "catalog:"`
- **`pnpm-lock.yaml`** is authoritative; CI uses `pnpm install --frozen-lockfile`
- **`minimumReleaseAge`** 48h (root `package.json`) — delays installing packages published in the last 48 hours
- Do **not** use `postinstall` npm shims or env vars to silence `baseline-browser-mapping`; upgrade Next when browser data is stale

## Backend gaps for full v1 hub parity (optional U3 tail)

Extend `CaseSummary` / SQLite for `caseId`, `department`, `client`, `deployment_mode`, `last_opened_at` if product requires v1 card fidelity.

## Related docs

- [desktop-workflow-mapping.md](desktop-workflow-mapping.md)
- [readiness.md](readiness.md)
- [phase-gates.md](phase-gates.md)
- [spec/user-flow-map.md](spec/user-flow-map.md)
- [implementation-readiness-gate.md](implementation-readiness-gate.md)
