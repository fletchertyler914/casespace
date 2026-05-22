# Master Gap Analysis (v1 → v2)

**Last refresh:** 2026-05-21 — full evidence-based source re-audit. Previous "Core Parity UX done" framing was overstated. See [`gap-analysis-ui-workflows.md`](gap-analysis-ui-workflows.md) for the row-by-row evidence table.

## Executive summary (honest)

v2 has a **functional MVP** of the v1 surface — case create/list/open/delete, multi-source folder/file ingest with incremental sync + dedup, folder-tree navigation, in-app previews for ~15 file categories (PDF/DOCX/XLSX/CSV/image/text/code/markdown/video/audio + external fallback), notes/findings/timeline plain-text CRUD, status-lane board with drag/drop, MVP timer + markdown report export, workspace preferences persistence, and a marketing site with GitHub-release-driven download chooser.

It is **not** v1-complete and **should not be presented as such**. The most concrete gaps:

| Severity | Gap |
|----------|-----|
| **Broken** | Global search dialog (`search_all` Rust shape mismatches UI contract — renders empty) |
| **Broken / shallow** | `merge_duplicate_metadata` doesn't move notes/findings/timeline refs to the primary like v1 |
| **Missing (UX)** | No inventory data grid — only folder tree; v1's full column/sort/filter/bulk-select grid is the central work surface |
| **Missing (UX)** | No metadata panel in viewer, no rename/delete in viewer, no file-change warning, no fullscreen, no keyboard shortcuts |
| **Missing (UX)** | No Tiptap rich notes/findings; plain textarea only |
| **Missing (UX)** | No column / mapping config UI; backend tables orphaned; extraction engine (regex/date/number) not implemented |
| **Missing (UX)** | No EditCaseDialog (case rename / metadata edit); backend `update_case_metadata` orphaned |
| **Shallow** | Time tracking has no segment model — `pause` actually stops and `resume` starts a fresh entry. No billing config UI, no segment edit, no daily summary capture |
| **Shallow** | Reports are markdown-only exports; v1 has structured sections + preview |
| **Shallow** | Duplicates panel lists groups + sets primary; v1 has comparison UI, decision dialog, badges across navigator + viewer, ingestion notification |
| **Missing (deploy)** | No `tauri-plugin-updater` wired; no Developer ID signing; no Windows signing; no notarization |

## Reality-check scorecard

Categories use `✅ done` / `🟡 MVP` / `🟠 partial` / `🔴 missing`. Evidence in [`gap-analysis-ui-workflows.md`](gap-analysis-ui-workflows.md).

| Domain | Backend | UI |
|--------|---------|-----|
| Case CRUD | ✅ | 🟡 (no rename / metadata edit) |
| Sources | ✅ | 🟡 (no remove, no per-source UI) |
| Ingest / sync / dedup | ✅ | 🟡 (toast only — no progress, no cancel) |
| File table | n/a | 🔴 |
| File viewer routing | n/a | ✅ (after v0.1.6 fix) |
| File viewer header actions | ✅ | 🔴 (status + nav only) |
| Metadata panel | ✅ command | 🔴 |
| File change detection | ✅ commands | 🔴 UI |
| Notes | ✅ | 🟡 (plain textarea) |
| Findings | ✅ | 🟡 (title + plain body; no severity / linked files / tags UI) |
| Timeline | ✅ | 🟡 (description only; no date picker / event type / source link) |
| Duplicates | 🟡 (merge doesn't relink artifacts) | 🟡 (list + set primary only) |
| Board | n/a | 🟡 (lanes + DnD; no multi-select / filters / rich cards) |
| Time / billing | 🟡 (no segments) | 🟡 (timer + simple entries) |
| Reports | 🟡 (markdown only) | 🟡 (5 export buttons + side panel) |
| Search | 🟠 (`search_all` returns strings; UI expects structured) | 🟠 (broken) |
| Settings | ✅ workspace prefs | 🟡 (workspace prefs only; no theme/system-filter UI) |
| Mapping / column config | ✅ get/save commands | 🔴 (no UI; extraction engine missing) |
| Splash / loading | n/a | 🟠 (component exists, unwired) |
| Toast | n/a | 🟡 (used in auto-sync only) |
| Theme | n/a | ✅ |
| Updater | 🔴 | 🔴 |
| Code signing (macOS) | 🟠 ad-hoc only | n/a |
| Code signing (Windows) | 🔴 | n/a |
| Notarization | 🔴 | n/a |
| Frontend unit tests | n/a | 🔴 |
| E2E tests | 🔴 | 🔴 |
| Backend unit tests | 🟡 (DB-level rather than command-level) | n/a |

## Cross-track risk rollup (refreshed)

| Priority | Risk |
|----------|------|
| **P0 broken** | Search dialog contract mismatch; `merge_duplicate_metadata` doesn't relink artifacts |
| **P0 missing** | No file table; no metadata panel; no viewer rename/delete; no edit-case dialog |
| **P1 shallow** | Notes/findings/timeline editors; duplicates resolution depth; time/billing segment model; reports structure |
| **P1 missing** | Column/mapping UI + extraction engine |
| **P2 deploy** | Updater plugin; Developer ID + Windows code signing; notarization |
| **P2 polish** | Ingest progress UI; large-folder warning; settings depth; theme toggle accessibility from workspace |

## Launch critical path (rewritten)

The previous critical path checked boxes that aren't actually checked. Replacing with the honest version:

1. ~~Author and lock spec pack~~ ✅
2. ~~Node 24 toolchain policy~~ ✅
3. ~~SQLite + migrations + core schema~~ ✅
4. ~~Ingest + load case files (persisted)~~ ✅
5. Case hub UI ✅ — workspace UI **shallow MVP only**
6. Artifacts CRUD + FTS search — **search dialog broken; artifact editors plain text**
7. Review status + report exports + timer/billing — **status ✅; reports markdown only; timer lacks segments**
8. **Inventory data grid** — *not started; biggest UX gap*
9. **Metadata + file-change + rename/delete in viewer** — *not started*
10. **Duplicates resolution depth** — *partial*
11. **Tiptap notes/findings + dedicated create dialogs** — *not started*
12. **Time/billing depth** — *partial*
13. **Mapping / column config UI + extraction engine** — *not started*
14. **Updater + production signing** — *not started*
15. UX Parity Build Gate — **not earned; cannot be claimed until 8–14 land**
16. AINative — **gated on UX parity**

## Deferred backlog with rationale

| Item | Rationale |
|------|-----------|
| All AI features | Honest UX parity must come first |
| Team / collaboration | Solo launch wedge |
| v1 DB import | After v2 schema stable + parity proven |
| Custom report templates | After structured-section reports land |

## Final go/no-go recommendation

- **Planning go:** ✅ — spec pack, mapping artifacts, and this honest gap analysis are complete.
- **Implementation go:** ✅ — already in flight; this doc rewrites the critical path so progress can be measured truthfully.
- **UX Parity Build Gate go:** ❌ — cannot be claimed today. Realistic earliest pass: **after items 1, 2, 3, 5, and 11 of the rewritten critical path** land, with manual E2E coverage of `spec/user-flow-map.md`.
- **AI go:** ❌ — still gated.
- **Production distribution go:** ❌ — needs updater + production signing + notarization (item 14).

## Track documents

- [gap-analysis-ui-workflows.md](gap-analysis-ui-workflows.md) — **detailed evidence table (this audit's primary deliverable)**
- [gap-analysis-backend.md](gap-analysis-backend.md) — backend command-level inventory (older; may need refresh)
- [gap-analysis-data-schema.md](gap-analysis-data-schema.md) — schema parity
- [gap-analysis-dependencies.md](gap-analysis-dependencies.md) — dependency drift
- [../ui-port-plan.md](../ui-port-plan.md) — phase plan (refreshed to match this audit)
- [../readiness.md](../readiness.md) — readiness (refreshed to match this audit)
