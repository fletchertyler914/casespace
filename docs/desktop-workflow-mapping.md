# Desktop Workflow Mapping

Component and route map for `apps/desktop`. Roadmap: [product-roadmap.md](product-roadmap.md).

**Last updated:** 2026-05-22

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
| Report sections | `report-section-navigator.tsx`, `reports-view.tsx` |
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
