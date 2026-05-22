# Master Gap Analysis (v1 → v2)

**Last refresh:** 2026-05-21 — V1 parity closure implementation pass. See [`gap-analysis-ui-workflows.md`](gap-analysis-ui-workflows.md) for row-level status (stale rows being updated).

## Executive summary (honest)

v2 now implements the **major v1 desktop workflows in code**: inventory table + column config, viewer metadata/rename/delete/file-change/keyboard/fullscreen, structured global search, Tiptap artifacts, duplicates depth + fixed merge relinking, time segments + billing UI, structured reports workspace, mapping UI + Rust extraction engine, case/app settings dialogs.

**UX Parity Build Gate is still NOT EARNED (validated)** — requires manual E2E on [`user-flow-map.md`](user-flow-map.md). Remaining product gaps vs v1:

| Severity | Gap |
|----------|-----|
| **Shallow** | Board — no multi-select, lane filters, rich cards |
| **Deferred** | Report PDF/DOCX exports |
| **Shallow** | PDF viewer — no annotations/bookmarks/OCR |
| **Missing (deploy)** | Production signing + notarization; updater placeholders only |

## Reality-check scorecard

Categories use `✅ done` / `🟡 MVP` / `🟠 partial` / `🔴 missing`. Evidence in [`gap-analysis-ui-workflows.md`](gap-analysis-ui-workflows.md).

| Domain | Backend | UI |
|--------|---------|-----|
| Case CRUD | ✅ | 🟡 (no rename / metadata edit) |
| Sources | ✅ | 🟡 (no remove, no per-source UI) |
| Ingest / sync / dedup | ✅ | 🟡 (toast only — no progress, no cancel) |
| File table | n/a | ✅ (local) |
| File viewer routing | n/a | ✅ |
| File viewer header actions | ✅ | ✅ (local) |
| Metadata panel | ✅ | ✅ (local) |
| File change detection | ✅ | ✅ (local) |
| Notes | ✅ | ✅ Tiptap (local) |
| Findings | ✅ | ✅ severity/tags/links (local) |
| Timeline | ✅ | ✅ date/type/source (local) |
| Duplicates | ✅ merge relinks | ✅ depth UI (local) |
| Board | n/a | 🟡 (lanes + DnD; no multi-select / filters / rich cards) |
| Time / billing | ✅ segments | ✅ (local) |
| Reports | ✅ + history | ✅ workspace (local); PDF/DOCX deferred |
| Search | ✅ structured hits | ✅ (local) |
| Settings | ✅ | ✅ app + workspace (local) |
| Mapping / column config | ✅ extraction | ✅ UI (local) |
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
