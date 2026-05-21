# Desktop Workflow Mapping (v1 UI → v2)

**Status:** Backend P0 commands **implemented**. UI port **U1–U6 done/MVP**; U7/U8/U9/U10 in progress; U11 gate/cleanup active. Plan: [ui-port-plan.md](ui-port-plan.md).

## v1 → v2 component map

| v1 path | v2 target | Phase | Status |
|---------|-----------|-------|--------|
| `src/App.tsx` | `app/layout.tsx` + routes | P0 | **done** — providers, theme, splash |
| `components/case/CaseListView` | `components/case/case-list-view.tsx` | U3 | **done** |
| `components/case/CaseListCard` | `components/case/case-list-card.tsx` | U3 | **done** |
| `components/case/CreateCaseDialog` | `components/case/create-case-dialog.tsx` | U3 | **done** |
| `components/case/DeleteCaseConfirmationDialog` | `components/case/delete-case-confirmation-dialog.tsx` | U3 | **done** |
| `components/case/EditCaseDialog` | `components/case/edit-case-dialog.tsx` | U3 tail | planned |
| `components/workspace/CaseWorkspace` | `components/workspace/case-workspace-shell.tsx` | U4 | **done** |
| `components/workspace/WorkspaceLayout` | `components/workspace/workspace-layout.tsx` | U4 | **done** |
| `components/workspace/FileNavigator` | `components/workspace/file-navigator.tsx` | U4 | **done** |
| `components/workspace/SplitView` | `components/workspace/split-view.tsx` | U4 | **done** |
| `components/workspace/CaseHeader` | `components/workspace/case-header.tsx` | U4 | **done** |
| `components/workspace/IntegratedFileViewer` | `components/viewer/file-viewer.tsx` + previews | U5 | **done** |
| `components/viewer/PdfViewerWrapper` | `components/viewer/pdf-file-preview.tsx` | U5 | **done** |
| `components/board/WorkflowBoard` | `components/workspace/board-view.tsx` | U7 | **MVP** — status swimlanes + drag/drop |
| `components/notes/NotePanel` | `components/artifacts/notes-panel.tsx` | U6 | **MVP** — CRUD + pin; Tiptap P1 |
| `components/findings/FindingsPanel` | `components/artifacts/findings-panel.tsx` | U6 | **MVP** — CRUD |
| `components/timeline/TimelineView` | `components/artifacts/timeline-panel.tsx` | U6 | **MVP** — CRUD |
| `components/duplicates/*` | `components/artifacts/duplicates-panel.tsx` | U7 | **MVP** — list groups + set primary + metadata merge |
| `components/search/SearchDialog` | `components/search/search-dialog.tsx` | U10 | **MVP** — cmdk search wired |
| `components/time/TimerWidget` | `components/billing/timer-widget.tsx` | U8 | **MVP** — start/stop + elapsed |
| `components/time/TimeManagementPage` | `components/billing/time-panel.tsx` | U8 | **MVP** — entries + billing summary + controls |
| `components/reports/ReportView` | `components/artifacts/reports-panel.tsx` | U9 | **MVP** — export + preview; full report view pending |
| `src/services/*` | `lib/command-client.ts` (+ future `lib/services/*`) | P0 | **partial** |
| `src/hooks/*` | `hooks/*`, `hooks/use-workspace-panels.ts`, etc. | P0 | **partial** |
| `components/mapping/*` | — | P1 | defer |

## Adapter boundary

```
UI Component → hooks → command-client → Tauri invoke
```

No `invoke()` in components. Expand `lib/command-client.ts` as each surface ships.

## Current v2 routes

| Route / file | Behavior |
|--------------|----------|
| `app/page.tsx` | Case hub — `CaseListView` |
| `app/case/page.tsx` + `page-client.tsx` | `CaseWorkspaceShell` — navigator, viewer, panels |
| `components/case-workspace.tsx` | **Removed** |
| `lib/command-client.ts` | Typed P0 command wrappers |
| `lib/file-preview.ts` | Preview kind router (pdf/docx/xlsx/unsupported/…) |
| `lib/open-file.ts` | External open for unsupported types only |
| `lib/tauri-dialog.ts` | Native folder/file pickers |

## P0 screen flow

1. `/` — Case list (hub) ✅
2. `/case?id=` — Workspace (navigator \| viewer \| notes/findings/timeline) ✅
3. Modals: create ✅, delete ✅; edit/large-folder — U3 tail
4. Command palette: global search ✅ (U10 MVP)
5. Board + duplicates — U7 (duplicates panel MVP + board drag/drop shipped; parity polish pending)

## Drop at UX gate (U11)

- Enterprise case filters (unless U3 tail)
- Full v1 kanban parity if simplified board/table suffices

See [spec/user-flow-map.md](spec/user-flow-map.md) and [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md).
