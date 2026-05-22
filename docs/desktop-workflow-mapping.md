# Desktop Workflow Mapping (v1 UI → v2)

**Status (2026-05-21, v0.1.7):** V1 parity closure landed in `apps/desktop` + backend. UX gate validation pending manual E2E. Plan: [ui-port-plan.md](ui-port-plan.md).

## v1 → v2 component map

| v1 path | v2 target | Phase | Status |
|---------|-----------|-------|--------|
| `src/App.tsx` | `app/layout.tsx` + routes | P0 | **done** |
| `components/case/CaseListView` | `components/case/case-list-view.tsx` | U3 | **done** |
| `components/case/CaseListCard` | `components/case/case-list-card.tsx` | U3 | **done** |
| `components/case/CreateCaseDialog` | `components/case/create-case-dialog.tsx` | U3 | **done** |
| `components/case/EditCaseDialog` | `components/case/edit-case-dialog.tsx` | U3 | **done** |
| `components/case/DeleteCaseConfirmationDialog` | `components/case/delete-case-confirmation-dialog.tsx` | U3 | **done** |
| `components/case/LargeFolderWarningDialog` | `components/case/large-folder-warning-dialog.tsx` | U3 | **done** |
| `components/workspace/CaseWorkspace` | `components/workspace/case-workspace-shell.tsx` | U4 | **done** |
| `components/workspace/WorkspaceLayout` | `components/workspace/workspace-layout.tsx` | U4 | **done** |
| `components/workspace/FileNavigator` | `components/workspace/file-navigator.tsx` | U4 | **done** — tree + table toggle |
| `components/workspace/FileTable` | `components/workspace/file-table.tsx` | U4 | **done** |
| `components/workspace/SplitView` | `components/workspace/split-view.tsx` | U4 | **done** |
| `components/workspace/CaseHeader` | `components/workspace/case-header.tsx` | U4 | **done** |
| `components/workspace/IntegratedFileViewer` | `components/viewer/*` + `file-viewer-pane.tsx` | U5 | **done** |
| `components/viewer/*` previews | `pdf`, `docx`, `xlsx`, `code` (syntax), `image` (zoom), `markdown`, etc. | U5 | **done** |
| `components/mapping/*` | `components/mapping/field-mapper-stepper.tsx`, `components/table/column-manager.tsx`, `columns-mapping-dialog.tsx` | U4/P1 | **done** |
| `components/board/WorkflowBoard` | `components/workspace/board-view.tsx` | U7 | **MVP** — lanes + DnD; multi-select/filters deferred |
| `components/notes/NotePanel` | `components/artifacts/notes-panel.tsx` + Tiptap | U6 | **done** |
| `components/findings/FindingsPanel` | `components/artifacts/findings-panel.tsx` | U6 | **done** |
| `components/timeline/TimelineView` | `components/artifacts/timeline-panel.tsx` | U6 | **done** |
| `components/duplicates/*` | `duplicate-management-panel`, badges, decision dialog, ingestion notification | U7 | **done** |
| `components/search/SearchDialog` | `components/search/search-dialog.tsx` | U10 | **done** — structured FTS hits |
| `components/time/*` | `timer-widget`, `time-panel`, segment/billing dialogs | U8 | **done** |
| `components/reports/ReportView` | `reports-panel.tsx` + `reports-workspace.tsx` | U9 | **done** — markdown + history; PDF/DOCX deferred |
| `components/settings/*` | `components/settings/app-settings-dialog.tsx` | U10 | **done** |
| `src/services/*` | `lib/command-client.ts` | P0 | **done** (P0 surface) |

## Adapter boundary

```
UI Component → hooks → command-client → Tauri invoke
```

No `invoke()` in components.

## Current v2 routes

| Route / file | Behavior |
|--------------|----------|
| `app/page.tsx` | Case hub |
| `app/case/page.tsx` + `page-client.tsx` | `CaseWorkspaceShell` |
| `lib/command-client.ts` | Typed command wrappers |
| `lib/file-preview.ts` | Preview kind router |

## Next phases (post v0.1.7)

1. **UX gate** — manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md); board depth
2. **Production distribution** — Developer ID, Windows signing, notarization, live updater keys
3. **AINative** — blocked until UX gate passes

See [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md).
