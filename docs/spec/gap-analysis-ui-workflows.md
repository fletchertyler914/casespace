# UI and Workflow Gap Analysis (v1 → v2)

**Last refresh:** 2026-05-21 (v0.1.7 parity closure). Implementation pass landed; rows below are being aligned to current code. UX Parity Build Gate still requires manual E2E — see [readiness.md](../readiness.md).

## Audit method

Both audits were code-only — no docs trusted, no tests trusted. Tools: grep + read + symbol walks.

- **v1 reference inventory:** every `#[tauri::command]`, every dialog/component/hook/service in `inventory-generator/src/` and `inventory-generator/src-tauri/src/`. ~22 categories.
- **v2 actual implementation:** every route, component, command, table, and dialog actually present in `casespace/apps/{desktop,desktop-backend,web}` and `casespace/packages/*`.

Each row below carries the v1 reference path, the v2 path (if any), and an honest status:

- `✅ done` — v2 matches v1 outcome end-to-end (UI → command → persistence → UI feedback)
- `🟡 MVP` — works, but materially shallower than v1 (specific gap called out)
- `🟠 partial` — exists only at one layer (e.g. backend command but no UI, or UI but with a runtime bug)
- `🔴 missing` — nothing exists in v2

## Executive scorecard

| Domain | v1 surface | v2 status | Headline gap |
|--------|-----------|-----------|--------------|
| Case CRUD | create, list, open, rename/edit metadata, delete | 🟡 create/list/open/delete only | No rename / edit-metadata / case-settings dialog (`update_case_metadata` backend command exists, no UI calls it) |
| Sources | add folder/file, list, auto-sync, manual sync | 🟡 add + sync only | No per-source UI, no remove-source (v1 also lacks this) |
| Ingest / sync UI | dialog progress, duplicate notification, large-folder warning | 🟡 toast summary only | No progress bar, no cancellable sync, no `LargeFolderWarningDialog`, no `DuplicateIngestionNotification` |
| Inventory table | full data grid with columns/filters/sort/group/bulk/multi-select/inline edit | ✅ done (local) | `file-table.tsx` + tree/table toggle; persisted column visibility |
| Column / mapping config | `ColumnManager`, `FieldMapperStepper`, extraction engine | ✅ done (local) | `columns-mapping-dialog`, `field_extraction.rs`, column manager |
| File viewer router | image, pdf, docx, xlsx, csv, code (syntax-highlighted), markdown (Tiptap), text, video, audio, unsupported | 🟡 extensions match | Routing OK; per-viewer depth is the real gap (see Viewer table below) |
| Viewer header / actions | status, prev/next, close, metadata, rename, delete, duplicates, file-change, fullscreen, keyboard | ✅ done (local) | `file-viewer-pane.tsx` + dialogs |
| Metadata panel | MD5+SHA-256, PDF info, EXIF, etc. | ✅ done (local) | `metadata-panel.tsx` |
| File-change warning | live staleness detection, refresh | ✅ done (local) | `file-change-warning.tsx` |
| Rename / delete file dialogs | RenameFileDialog, DeleteFileDialog | ✅ done (local) | `rename-file-dialog`, `delete-file-dialog` |
| Notes editor | Tiptap rich text + dedicated `CreateNoteDialog` | 🟡 plain textarea | No formatting, headings, lists, task lists, links, images, code blocks, undo/redo |
| Findings | severity selector + linked-files + tags + Tiptap description + `CreateFindingDialog` | 🟡 title + plain description only | Severity exists in backend, not selectable; no linked files, no tags, no Tiptap |
| Timeline | date picker, event type, source-file link, auto-extracted events from ingest | 🟡 description-only CRUD | No date picker, no event types, no source link, no `extract_dates_from_file` wiring |
| Duplicates panel | `DuplicateManagementPanel`, group view, primary/recommended ordering, keep/delete cards, decision dialog, ingestion notification, badges across navigator + viewer | 🟡 list + set primary + "merge metadata" | "Merge" only marks primary reviewed + soft-deletes others; does **not** move notes/finding/timeline refs like v1. No comparison UI, no ignore/delete actions, no badges, no decision dialog |
| Board | DnD between status lanes, **multi-select** (`Cmd/Ctrl+Click`, `Shift+Click`), per-swimlane filters, folder-filtered board, rich cards (note count, dup badge, change indicator, tags, mapping fields), progress dashboard | 🟡 @dnd-kit lanes + multi-drag + filters + dup badge cards | Status via drag only (no card dropdown). Missing: note counts, change dot, tags/mapping on cards, `ProgressDashboard` |
| Time / billing | `useTimer`, segments, `SegmentEditDialog`, `DailySummaryDialog`, `BillingConfigDialog`, list/calendar views, search, batch update, billable vs non-billable, rate units (hourly/daily/weekly/monthly), pause/resume = same entry | 🟡 timer widget + simple entries | `pause_timer` actually stops; `resume_timer` starts a new entry — no segment model. No manual entry CRUD, no billing config UI, no daily summary dialog, no calendar view, no batch edit |
| Reports | structured sections (Executive Summary, Case Overview, Findings, Timeline, Inventory Summary, Notes, Appendices), preview, section navigation, `useReportData` aggregator | 🟡 markdown export only | Side panel with 5 export buttons; backend `export_case_report` writes Markdown files to app data dir. No structured sections, no preview-per-type, no PDF/DOCX exports, no persistent history |
| Global search | grouped FTS results | ✅ done (local) | Structured `SearchHit[]`; findings + timeline included |
| Workspace prefs | `view_mode`, `report_mode`, panel visibility, navigator state, auto-sync | 🟡 partial | Panel sizes not persisted; only toggles/view mode/auto-sync prefs saved |
| App settings | theme (light/dark/system) + system-file-filter config (patterns: `.DS_Store`, `Thumbs.db`, `~$*`, etc.) | 🟡 theme only | `ThemeToggle` exists but lives on case list, not in workspace settings. No system-file-filter UI; backend has no such command |
| Splash / loading | `SplashScreen` | 🟠 unwired | Component exists but never rendered |
| Toast notifications | `useToast`, success/error variants | 🟡 present | Used in `useWorkspaceAutoSync`; not consistently used elsewhere |
| Theme | system theme detection, persistent across reloads, applied to PDF reader | ✅ done | `ThemeProvider` + PDF theme sync works |
| Update flow | `tauri-plugin-updater` + signed releases | 🟠 placeholder | Plugin wired; pubkey/endpoints placeholder; prod signing blocked |
| Code signing | macOS Developer ID + Windows signing strategy in v1 build pipeline | 🟠 ad-hoc only | `tauri.conf.json` uses `"signingIdentity": "-"`; no Developer ID config, no Windows signing, no notarization — fine for local install with manual Gatekeeper approval, not safe for unattended distribution |

## Critical breakage to fix immediately

| Item | Evidence | Severity | Fix sketch |
|------|----------|----------|------------|
| Search dialog shape mismatch | `search_all` returns `Vec<String>` (`apps/desktop-backend/src-tauri/src/lib.rs`) but `command-client.ts` types it as `SearchHit[]` and `search-dialog.tsx` reads `.entityType`/`.title`/`.snippet` | **P0** — dialog opens, renders nothing | Either change the Rust command to return structured `SearchHit { entity_type, id, title, snippet, score }` or parse the strings client-side and look up titles via separate fetches. Recommendation: change Rust to return structured hits and include findings/timeline (which already have FTS tables but aren't searched by `search_all`) |
| `merge_duplicate_metadata` semantic gap | v2 implementation marks primary reviewed + soft-deletes other rows; v1 also moves notes / finding linked-file refs / timeline source-file refs | **P0** | Port v1's merge: update notes' `file_id`, update findings' `linked_files`, update timeline `source_file_id` to point to primary before soft-delete |
| Viewer cannot rename / delete / show metadata / refresh on change | Header actions in `file-viewer-pane.tsx` only expose status + prev/next + close + open-externally; all corresponding backend commands exist | **P1** | Add `rename-file-dialog`, `delete-file-dialog`, metadata popover, `FileChangeWarning` strip — wire to existing commands |
| Notes editor is plain textarea | v1 uses Tiptap with rich formatting; UX gap is large for forensic notes | **P1** | Add `@tiptap/react` + extensions (already in v1 deps list); replace textarea with Tiptap shell |

## Domain detail — file viewer (where the parity gap surfaced this session)

Routing is now correct (v0.1.6 commit `a11bf20` added video/audio/code categories and fixed the PDF `useMemo` regression). Per-viewer depth is still MVP.

| Viewer | v1 features | v2 features | Gap |
|--------|------------|------------|-----|
| PDF | `@react-pdf-viewer` with default layout + custom toolbar + theme integration + viewer-search Cmd/F prevention | same plugin + custom toolbar + theme sync | **No annotations, bookmarks, OCR text layer, saved viewer state, fullscreen toggle** |
| DOCX | `mammoth` HTML render | `mammoth` HTML render | Parity |
| XLSX | `xlsx-js-style`, header detection, multi-sheet, merged-cell title rendering | first sheet only, no header detection, simple table | **No sheet tabs, no header detection, no merged-cell handling** |
| CSV | delimiter detection, normalized columns, full-rows | delimiter detection, 500-row cap, normalized columns | Mostly parity; v2 caps rows |
| Image | `react-viewer` with zoom/rotate fullscreen | basic `<img>` fit | **No zoom, no rotate, no fullscreen** |
| Markdown | `marked` + Tiptap read-only render | `<pre>` with `.prose` class | **No rendered markdown — shows raw text in mono** |
| Code | lazy `react-syntax-highlighter` + custom OKLCH themes | `<pre>` mono fallback | **No syntax highlighting** |
| Text | `<pre>` mono | `<pre>` mono | Parity |
| Video | HTML5 `<video>` via `convertFileSrc` (streaming) | HTML5 `<video>` via base64 → blob URL (whole file in memory) | Works; whole-file in memory hurts large videos |
| Audio | HTML5 `<audio>` via `convertFileSrc` | HTML5 `<audio>` via base64 → blob URL | Same as video |

## Missing-entirely dialog catalog

Every dialog in v1 that has **no v2 counterpart**:

- `EditCaseDialog` — edit case metadata + per-case column config
- `LargeFolderWarningDialog` — warn before importing many files (depends on `count_directory_files`)
- `RenameFileDialog` — file rename with name validation + sync-first option
- `DeleteFileDialog` — file remove from case (separate from delete-case)
- `DuplicateFileDialog` — viewer-level duplicate review
- `DuplicateDecisionDialog` — confirm delete-or-merge on dup resolution
- `BillingConfigDialog` — fixed-price vs pay-rate configuration
- `SegmentEditDialog` — create/edit/delete time segments
- `DailySummaryDialog` — capture summary after stopping the timer
- `DeleteTimeEntryDialog` — confirm time entry deletion
- `CreateNoteDialog` (Tiptap) — create/edit notes with rich text
- `CreateFindingDialog` (Tiptap) — create/edit findings with rich text + severity + linked files
- `CreateTimelineEventDialog` — create timeline event with date picker + event type + source file
- `SettingsDialog` (app-level) — theme + system-file-filter config
- Column manager modal (`ColumnManager`) — column visibility/order
- Mapping stepper (`FieldMapperStepper`) — regex/pattern/date extraction config

## Missing-entirely components / hooks

- `MetadataPanel` (viewer) — file hashes + format-specific metadata
- `FileChangeWarning` (viewer) — staleness banner with refresh action
- `DuplicateBadge` (file rows + viewer) — visual dup indicator
- `DuplicateIngestionNotification` — post-sync duplicate summary
- `FileDuplicatePanel` — viewer-scoped duplicates
- `DuplicateManagementPanel` — case-level duplicate review with stats
- `ProgressDashboard` — board completion summary
- `CaseFilters` — case-list filter chips
- `CaseSwitcher` — dropdown to switch between recent cases
- `useTimer` semantics with segment model
- `useFileNavigation` keyboard navigation hook
- `useWorkflowSelection` multi-select hook for board
- `useSwimlaneFilter` per-lane filters
- `useReportData` aggregator
- `request-cache` performance layer

## Missing-entirely backend surface

- `update_case_metadata` (exists, **unused**)
- `get_or_create_case` (exists, **unused**)
- `check_file_changed`, `refresh_single_file`, `refresh_files_bulk` (exist, **unused**)
- `rename_file`, `remove_file_from_case` (exist, **unused**)
- `extract_file_metadata` (exists, **unused**)
- `get_file_note_counts` — not implemented; v1 uses for navigator note badges
- `extract_dates_from_file` — not implemented; v1 uses to auto-create timeline events on ingest
- Time tracking depth: v1 has `update_time_entry`, `update_time_segment`, `create_time_segment`, `delete_time_segment`, `delete_time_entry`, `batch_update_segments`, `get_time_entry`, `get_time_entries_summary`, `set_case_billing_config`, `get_case_billing_config`, `calculate_case_total` — v2 only has `start/stop/pause/resume_timer`, `get_time_entries`, `calculate_billing_amount`
- System file filter: `get_system_file_filter_config`, `save_system_file_filter_config` — not implemented
- `column_configs` / `mapping_configs` get/save commands exist but no UI; underlying extraction engine (regex/date/number/text-before/after/between) is not implemented at all
- `tauri-plugin-updater` not installed; no update-check / download / install commands

## Tests parity

| Suite | v1 | v2 |
|-------|----|----|
| Backend unit (repositories) | ✅ `src-tauri/src/repositories/tests*.rs`, `commands/tests*.rs` | 🟡 inline `parity_flows.rs` + `hardening_pass.rs` — many tests insert directly into SQLite rather than calling commands |
| Backend critical features | ✅ `commands/tests_critical_features.rs` | 🟠 partial — covered by `parity_flows.rs` |
| Backend performance | ✅ `commands/tests_performance.rs` | 🟠 10k-file insert in `hardening_pass.rs` only |
| Frontend unit + component (vitest) | ✅ 146 tests — contract (65 commands), artifacts/billing panels, path/tree utils, viewer dialogs | 🟡 file-table component + workspace-preferences hooks |
| Frontend UI E2E (Playwright) | ✅ case hub, workspace, search (mocked invoke) | 🟡 native Tauri E2E still manual; expand flow coverage |
| E2E | scripts/test-built-app.sh | 🔴 missing |

## Updater & code signing

| Concern | v1 | v2 | Recommendation |
|---------|----|----|----------------|
| Updater plugin | `tauri-plugin-updater` wired | 🔴 missing | Add when there's a signed release stream |
| Update manifest endpoints | configured in `tauri.conf.json` | 🔴 missing | Same |
| Updater pubkey | configured | 🔴 missing | Same |
| macOS Developer ID | available in v1 build env | 🔴 missing — ad-hoc only | Required before public distribution; current "is damaged" was solved with ad-hoc fix in v0.1.5 |
| Windows code signing | available in v1 | 🔴 missing | Required before public distribution |
| Notarization | available in v1 | 🔴 missing | Required for Gatekeeper-clean macOS auto-update |

## Recommended next phases (honest)

Numbered in dependency order, not chronological.

1. **Search dialog runtime fix** — make `search_all` return structured `SearchHit` with findings + timeline included. Half-day.
2. **Viewer header parity** — add `rename-file-dialog`, `delete-file-dialog`, metadata popover, file-change warning. Wire to existing backend commands. 1–2 days.
3. **File table** (replaces / supplements navigator) — full data grid with columns, filters, sort, group, bulk actions, inline edit, multi-select. The single biggest UX gap. 4–6 days.
4. **Column/mapping config** — port `ColumnManager` + `FieldMapperStepper`. Implement the Rust extraction engine (regex/date/number/text-before/after/between). 5–8 days.
5. **Notes + findings + timeline depth** — Tiptap rich text, dedicated create dialogs, severity selector, file links, date picker, event types. 3–4 days.
6. **Duplicates depth** — `DuplicateManagementPanel`, `DuplicateDecisionDialog`, conflict-resolution UI, ignore action, badges in navigator + viewer, fix `merge_duplicate_metadata` to actually move artifact references. 3 days.
7. **Time / billing depth** — segment model in Rust, `SegmentEditDialog`, `DailySummaryDialog`, `BillingConfigDialog`, `DeleteTimeEntryDialog`, list/calendar views, batch update. 5–7 days.
8. **Reports depth** — structured section model, preview-per-type, PDF/DOCX exports, persistent history. 3–4 days.
9. **App settings** — `SettingsDialog` with theme + system-file-filter config (and the missing Rust commands). 1–2 days.
10. **Ingest UX** — progress bar, cancellable sync, `LargeFolderWarningDialog`, `DuplicateIngestionNotification`. 2–3 days.
11. **Case rename / edit metadata** — `EditCaseDialog` + wire `update_case_metadata`. Half-day.
12. **Frontend unit tests** — vitest setup + start coverage on `command-client`, `file-preview`, viewer routing. Ongoing.
13. **Updater + production signing** — `tauri-plugin-updater`, Developer ID, Windows signing, notarization. Distinct workstream — needs paid Apple/Windows certs.

## Honest readiness for production

v0.1.7 delivers the major v1 desktop workflows in code (table, viewer actions, artifacts, duplicates, time, reports, mapping, search). **UX Parity Build Gate** is not validated until manual E2E passes. Remaining depth: board multi-select/filters, PDF/DOCX reports, production signing.

It is **not** ready to replace v1 for day-to-day forensic / inventory work because of: no file table, no rich notes, broken search, no metadata panel, no rename/delete in viewer, no real billing depth, no real duplicate resolution, no column mapping, no production signing/updater.
