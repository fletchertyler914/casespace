# UI Port Plan (v1 → v2)

Continuation plan after **Core Parity backend gate** passed locally. Backend commands, SQLite/FTS, parity, and hardening suites are complete; **UX parity with v1 is the active workstream**. AINative remains blocked until the **UX Parity Build Gate** passes.

**v1 reference:** `/Users/tyler/projects/malissa_projects/inventory-generator`  
**v2 target:** `apps/desktop` (Next.js + Tauri shell via `apps/desktop-backend`)

> **2026-05-21 honesty pass:** earlier "done" labels on U5–U10 were overstated. **2026-05-21 parity closure:** P0 search/merge fixes plus U5–U10 depth work landed in code (see [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md)). UX Parity Build Gate still requires manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md) before claiming **validated**.

## Executive status (2026-05-21, honest)

| Track | Status |
|-------|--------|
| Backend Core Parity | **PASS** — [command-parity-ledger.md](command-parity-ledger.md), `pnpm test:parity`, `pnpm test:hardening` |
| UI foundation (U1) | **done** |
| Primitives (U2) | **done** |
| Case hub (U3) | **implemented** — create/list/open/delete + `EditCaseDialog` + `LargeFolderWarningDialog` |
| Workspace shell (U4) | **implemented** — layout, folder tree + **inventory table** toggle, header, ingest UX hooks |
| Viewers (U5) | **implemented (local)** — metadata/rename/delete/file-change/keyboard/fullscreen; markdown render; syntax-highlighted code; image zoom/rotate/fullscreen; XLSX multi-sheet tabs. PDF annotations/OCR still out of scope |
| Artifact panels (U6) | **implemented (local)** — Tiptap notes/findings; timeline date/type/source; create dialogs |
| Duplicates + board (U7) | **implemented (local)** — management panel, badges, decision dialog, ingestion notification; merge relinks artifacts (parity test). Board still MVP (no multi-select/filters) |
| Time (U8) | **implemented (local)** — segments, billing config, daily summary, entry CRUD, pause/resume same entry |
| Reports (U9) | **implemented (local)** — structured workspace + export history; markdown export; PDF/DOCX deferred |
| Search / settings (U10) | **implemented (local)** — structured `search_all` + grouped dialog; app settings (theme/system-file-filter) |
| Mapping / column config | **implemented (local)** — `ColumnManager`, `FieldMapperStepper`, Rust `field_extraction`, columns/mapping dialog |
| UX gate + legacy cleanup (U11) | **not earned** — automated gates pass; needs [native-e2e-checklist.md](spec/native-e2e-checklist.md) in `pnpm dev` + board depth before **validated** |
| AINative | **blocked** — until UX Parity Build Gate |
| Updater + production signing | **placeholder wired** — `tauri-plugin-updater` + conf placeholders; Developer ID / Windows signing / notarization still **blocked** |
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

### Phase U5 — Viewers (extension routing ✅; per-viewer depth 🟡 MVP)

Extension routing matches v1 after v0.1.6 PDF crash fix + video/audio add. The categories below are routed correctly; per-viewer fidelity is still shallow. **Specific viewer-depth gaps** are tracked in [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md) ("Domain detail — file viewer" table):

- No metadata panel (`extract_file_metadata` backend command orphaned)
- No rename / delete / file-change warning in viewer pane (backend commands orphaned)
- No fullscreen, no viewer keyboard shortcuts
- Markdown renders as raw `<pre>` (no Tiptap markdown viewer)
- Code renders as raw `<pre>` (no `react-syntax-highlighter`)
- Image: no zoom / rotate / fullscreen (no `react-viewer`)
- XLSX: first sheet only, no header detection, no merged-cell handling
- CSV: capped at 500 rows
- Video/audio loaded as base64-→-blob URL (whole file in memory)


| Kind | Extensions | Implementation |
|------|-----------|----------------|
| Router | — | `lib/file-preview.ts` → `components/viewer/file-viewer.tsx` |
| PDF | `pdf` | `pdf-file-preview.tsx` + `pdf-toolbar.tsx` + `pdf-viewer-theme.css` (`@react-pdf-viewer/*`, worker in `public/pdf.worker.min.js`) |
| DOCX/DOC | `doc`, `docx` | `docx-file-preview.tsx` (`mammoth`) |
| XLSX/XLS | `xls`, `xlsx` | `xlsx-file-preview.tsx` (`xlsx-js-style`) |
| Image | `png`, `jpg`, `jpeg`, `gif`, `webp`, `bmp`, `svg`, `ico`, `tiff`, `tif`, `avif` | `image-file-preview.tsx` |
| Video | `mp4`, `webm`, `ogv`, `mov`, `m4v`, `mkv`, `avi`, `wmv`, `flv`, `3gp`, `mpeg`, `mpg`, `ts`, `mts`, `m2ts` | `video-file-preview.tsx` (HTML5 `<video>` + blob URL) |
| Audio | `mp3`, `wav`, `ogg`, `oga`, `aac`, `flac`, `m4a`, `wma`, `opus`, `amr`, `aiff`, `aif` | `audio-file-preview.tsx` (HTML5 `<audio>` + blob URL) |
| Markdown | `md`, `markdown`, `mdx` | `text-file-preview.tsx` (markdown variant) |
| CSV/TSV | `csv`, `tsv` | `csv-file-preview.tsx` |
| Code | 50+ extensions: `ts`, `tsx`, `js`, `jsx`, `py`, `rs`, `go`, `java`, `c`/`cpp`/`h`, `cs`, `kt`, `swift`, `rb`, `php`, `lua`, `r`, `dart`, `sh`/`bash`/`zsh`, `bat`/`cmd`/`ps1`, `sql`, `yaml`/`yml`/`toml`, `json`, `xml`, `html`, `css`/`scss`/`sass`/`less`, `dockerfile`, `makefile`, `gradle`, `proto`, `tf`, `hcl`, `patch`/`diff`, … | `text-file-preview.tsx` (monospaced fallback; lazy syntax-highlight upgrade tracked separately) |
| Text | `txt`, `log`, `readme`, `license`, `changelog`, `rtf` (+ bare `README`/`LICENSE`/`CHANGELOG`) | `text-file-preview.tsx` |
| Unsupported (open externally) | `ppt`/`pptx`/`odt`/`ods`/`odp`, archives (`zip`/`tar`/`gz`/`7z`/`rar`/`bz2`/`xz`), installers (`dmg`/`iso`/`exe`/`msi`/`bin`), `heic`/`heif`, fonts (`woff`/`woff2`/`ttf`/`otf`/`eot`) | `external-file-preview.tsx` — **Open externally** is the only action |

App theme drives PDF chrome (no in-viewer theme toggle). Custom toolbar: search, zoom, page nav, rotate, download, print.

The PDF viewer is wrapped in a local `ErrorBoundary` with a fallback that offers **Open externally** — so any future PDF.js failure stays scoped to the pane and never crashes the workspace.

**Note on the PDF hook contract (avoid regression):** `defaultLayoutPlugin(...)` must be called inline during render, not inside `useMemo`. The plugin registers React hooks internally; `useMemo` caches the instance and skips those hook calls on subsequent renders, causing React error #300 ("Rendered fewer hooks than expected"). This was the v0.1.5 PDF crash root cause and is enforced by an inline comment in `pdf-file-preview.tsx`. See `inventory-generator/src/components/viewer/PdfViewerWrapper.tsx` for the same warning.

**Deferred:** `MetadataPanel`, `FileChangeWarning`, Tiptap read-only markdown, syntax-highlighted code (lazy-loaded `react-syntax-highlighter`).

### Phase U6 — Artifact panels 🟡 MVP only

| Panel | Path | Scope (current) | Gap vs v1 |
|-------|------|-----------------|-----------|
| Notes | `components/artifacts/notes-panel.tsx` | Plain textarea CRUD + pin/unpin | **No Tiptap**, no `CreateNoteDialog`, no file-link surface, no filters, no search-in-panel |
| Findings | `components/artifacts/findings-panel.tsx` | Title + plain-text description CRUD | **No severity selector**, **no linked files**, **no tags UI**, **no Tiptap**, no `CreateFindingDialog` |
| Timeline | `components/artifacts/timeline-panel.tsx` | Description-only CRUD | **No date picker**, **no event types**, **no source-file link**, **no auto-extracted events from ingest** (v1 `extract_dates_from_file` not implemented) |

### Phase U7 — Board + duplicates 🟡 MVP

- Duplicates panel implemented in split view (`components/artifacts/duplicates-panel.tsx`) — list groups + set primary + "merge metadata"
- **Known bug:** `merge_duplicate_metadata` marks primary as reviewed + soft-deletes other rows but **does not** move notes / finding `linked_files` / timeline `source_file_id` like v1 does. Needs fix.
- **Missing vs v1:** `DuplicateManagementPanel` (case-level stats), `DuplicateGroupView`, `DuplicateFileCard` (primary/recommended/viewing badges), `DuplicateDecisionDialog` (delete-or-merge confirm), `DuplicateBadge` (across navigator + viewer rows), `DuplicateIngestionNotification`
- Board has 5 status lanes + DnD; **missing**: multi-select (`Cmd/Ctrl+Click`, `Shift+Click`), per-swimlane filters, folder-filtered board, rich card content (note count, dup badge, change indicator, tags, mapping fields), `ProgressDashboard`

### Phase U8 — Time management 🟡 MVP only

- Timer widget MVP in header (`components/billing/timer-widget.tsx`) with start/stop + live elapsed
- Time side panel MVP in split view (`components/billing/time-panel.tsx`) with entries, billing summary, and start/pause/resume/stop controls
- **Known bug:** `pause_timer` actually stops the entry; `resume_timer` starts a new one. There is no segment model. v1 has start/pause/resume on the **same entry** with multiple segments.
- **Missing vs v1:** manual entry CRUD, `SegmentEditDialog`, `DailySummaryDialog` (post-stop), `BillingConfigDialog` (fixed-price vs pay-rate + rate units), `DeleteTimeEntryDialog`, calendar view, search entries, batch update segments. Backend commands `update_time_entry`, `update_time_segment`, `create_time_segment`, `delete_time_segment`, `delete_time_entry`, `batch_update_segments`, `get_time_entry`, `get_time_entries_summary`, `set_case_billing_config`, `get_case_billing_config`, `calculate_case_total` all **not implemented**

## Next phases (re-prioritized 2026-05-21 from honest audit)

This list **supersedes** the previous "U7/U8/U9/U10 continuation" sections. Numbered in dependency order; see [spec/gap-analysis-master.md](spec/gap-analysis-master.md) for sizings.

1. **Fix broken search dialog** (P0 runtime bug; half-day)
2. **Fix `merge_duplicate_metadata` artifact relink** (P0 backend bug; half-day)
3. **Viewer header parity:** RenameFileDialog, DeleteFileDialog, MetadataPanel, FileChangeWarning, fullscreen, keyboard nav (1–2 days)
4. **Inventory data grid** — biggest UX gap (4–6 days)
5. **Tiptap rich artifact editors** + dedicated create dialogs with severity/date/event-type/source-file (3–4 days)
6. **Duplicates depth** — DuplicateManagementPanel + DuplicateDecisionDialog + badges (3 days)
7. **Time/billing depth** — Rust segment model + Segment/DailySummary/BillingConfig/DeleteTimeEntry dialogs + list/calendar (5–7 days)
8. **Reports depth** — structured sections + preview + PDF/DOCX + persistent history (3–4 days)
9. **Column / mapping config** — ColumnManager + FieldMapperStepper + Rust extraction engine (5–8 days)
10. **EditCaseDialog** + rename in case list (half-day)
11. **App SettingsDialog** — theme + system-file-filter + missing Rust commands (1 day)
12. **Ingest UX** — progress + cancellation + LargeFolderWarningDialog + DuplicateIngestionNotification (2–3 days)
13. **Frontend tests** — ✅ vitest (61) + Playwright E2E (3); expand Tiptap/file-table/billing + native Tauri smoke
14. **Updater + production signing** — `tauri-plugin-updater`, Developer ID, Windows signing, notarization (distinct workstream, needs paid certs)

### Phase U9 — Reports 🟡 MVP only

- Reports side panel MVP implemented (`components/artifacts/reports-panel.tsx`)
- Exports wired to `export_case_report` for: narrative, executive, evidence index, financial, billing invoice — **markdown files only**, written to app data exports dir
- Narrative preview wired via `generate_case_report`
- In-panel recent export history is **in-memory** (lost on reload)
- **Missing vs v1:** `ReportView` workspace page, `ReportSections` (Executive Summary / Case Overview / Findings / Timeline / Inventory Summary / Notes / Appendices) with structured rendering and preview-per-type; template editor; persistent export history (DB); PDF / DOCX exports; report customization; signatures / exhibits

### Phase U10 — Search + settings 🟠 search broken + settings shallow

- **Search dialog is broken at runtime** (`components/search/search-dialog.tsx`): `search_all` Rust returns `Vec<String>` like `"file:<id>"`; UI types it as `SearchHit[]` and reads `.entityType` / `.title` / `.snippet`. Dialog opens but renders nothing. Fix: change Rust to return structured hits **and** include findings + timeline (which have FTS tables but are not searched today).
- Workspace settings dialog shipped (`components/workspace/settings-dialog.tsx`) — auto-sync + panel default controls. Persists to `workspace_preferences` table.
- **Missing vs v1:** app-level `SettingsDialog` (theme + system-file-filter config with patterns `.DS_Store`, `Thumbs.db`, `desktop.ini`, `~$*`, etc.); backend commands `get_system_file_filter_config` / `save_system_file_filter_config` not implemented; theme toggle currently lives on case-list only, not reachable from workspace

### Phase U11 — UX gate + cleanup (NOT EARNED)

- Legacy `components/case-workspace.tsx` removed (shell is `case-workspace-shell.tsx`) ✅
- UX Parity Build Gate **cannot be claimed** until items 1–11 of [spec/gap-analysis-master.md](spec/gap-analysis-master.md) "Launch critical path (rewritten)" land
- After that: manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md) + `pnpm ops:validate:local` + refresh [desktop-workflow-mapping.md](desktop-workflow-mapping.md) and [spec/feature-catalog.md](spec/feature-catalog.md) row statuses

## UX Parity Build Gate (honest)

All must pass before AINative:

| # | Criterion | Status |
|---|-----------|--------|
| G1 | Case hub: list, create, open, delete, search/sort | **MVP** — no rename / edit metadata (`EditCaseDialog` missing) |
| G2 | Workspace: navigator + viewer + notes/findings/timeline panels | **MVP** — viewer header lacks rename/delete/metadata/file-change; artifact editors are plain textareas (no Tiptap) |
| G3 | File review status + ingest/sync from header | **MVP** — sync OK; no progress UI, no cancellation, no LargeFolderWarningDialog, no DuplicateIngestionNotification |
| G4 | In-app viewers for PDF/Office/spreadsheets + text/image/CSV + media | **routing done, depth MVP** — see U5 phase block above |
| G5 | Global search dialog (cmdk) with FTS | **🔴 BROKEN** — contract mismatch; renders empty |
| G6 | Timer + time management entry | **MVP** — pause/resume actually stop/restart; no segment model; no manual entry CRUD; no billing config UI |
| G7 | Report mode (five export types) | **MVP** — markdown exports only; no structured sections; no preview-per-type |
| G8 | Duplicate review UI | **MVP** — list + set primary only; `merge_duplicate_metadata` doesn't relink artifacts (known bug); no badges across navigator/viewer; no decision dialog |
| G9 | Theme/splash/error boundary on all routes | **partial** — theme done; splash component exists but unwired; error boundary present at root + viewer pane |
| G10 | No `invoke()` in components; `command-client` only | **done** |
| G11 | `pnpm dev` smoke on primary flows | not yet executed against v1 user-flow-map oracle |
| G12 | Backend regression suites on every merge | **ongoing** |
| G13 | **NEW** — Inventory data grid (replaces or supplements folder-tree navigator) | **🔴 missing** — single biggest UX gap |
| G14 | **NEW** — Column / mapping config UI + Rust extraction engine | **🔴 missing** — backend tables orphaned |
| G15 | **NEW** — Frontend unit tests (vitest) at parity with v1 test count | **🔴 missing** |

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
