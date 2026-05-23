# Desktop Workflow Mapping

Component and route map for `apps/desktop`. Roadmap: [product-roadmap.md](product-roadmap.md).

**Last updated:** 2026-05-23

## Routes

| Route | Component |
|-------|-----------|
| `/` | Case hub — `components/case/case-list-view.tsx` |
| `/case/[id]` | Workspace — `components/workspace/case-workspace-shell.tsx` |

## Workspace shell

| Concern | Path |
|---------|------|
| Header / modes | `case-header.tsx` — Evidence · Board · Report |
| Layout | `workspace-layout.tsx`, `workspace-navigator-shell.tsx` |
| File tree | `file-navigator.tsx` |
| Report workspace | `components/reports/report-workspace.tsx` — outline, canvas, citation inspector |
| Report outline (left) | `components/reports/report-outline.tsx` |
| Report sections (legacy shim) | `components/artifacts/reports-view.tsx` re-exports `ReportWorkspace` |
| Viewer pane | `file-viewer-pane.tsx`, `file-viewer.tsx` |
| Board | `board-view.tsx`, `board-workflow-card.tsx` |
| Panels | findings, timeline, notes, time (`time-panel.tsx`), agents |
| Timer (header) | `components/billing/timer-widget.tsx` — idle / running / paused |
| Time management | `components/billing/time-management/time-management-page.tsx` — ⋮ menu |
| Billing dialogs | `billing-config-dialog`, `daily-summary-dialog`, `segment-edit-dialog`, `delete-time-entry-dialog` |

## Viewers

| Kind | Module |
|------|--------|
| PDF | `pdf-file-preview.tsx`, `pdf-toolbar.tsx`, `pdf-viewer-theme.css` |
| DOCX | `docx-file-preview.tsx` |
| XLSX | `xlsx-file-preview.tsx` |
| Image / text / CSV | `*-file-preview.tsx` |
| Router | `lib/file-preview.ts` |

## Commands

All native I/O via `lib/command-client.ts` → Tauri commands in `apps/desktop-backend`.

## Report workspace — five customer flows

| Flow | User goal | UI / commands |
|------|-----------|---------------|
| **A — First draft** | One-click AI draft from evidence | `ReportEmptyState` → `generate_and_save_report_draft` |
| **B — Edit & iterate** | Inline Tiptap edit; regen respects locked/edited | `ReportSectionBlock` → `update_report_section`, `regenerate_report` |
| **C — Persona boilerplate** | Qualifications/compensation filled once | Settings → Examiner profile → `save_examiner_profile`; merged in `reports.rs` |
| **D — Verify citation** | Click pill → source inspector | `CitationInspector` + citation pills |
| **E — Snapshot / finalize / export** | Named snapshots, checklist, DOCX/Markdown | `FinalizeChecklistDialog`, `SnapshotBrowserDialog` → `create_report_snapshot`, `run_report_compliance_scan`, `export_report_docx` |

Persistence: schema v9 tables `report_drafts`, `report_snapshots`, `examiner_profile` ([database.rs](../apps/desktop-backend/src-tauri/src/database.rs)).
