# Desktop Workflow Mapping (v1 UI → v2)

**Status:** Backend P0 commands **implemented**. UI port **in progress** — case hub done; workspace phases U4–U11 pending. Continuation plan: [ui-port-plan.md](ui-port-plan.md).

## v1 → v2 component map

| v1 path | v2 target | Phase | Status |
|---------|-----------|-------|--------|
| `src/App.tsx` | `app/layout.tsx` + routes | P0 | **partial** — providers, theme, splash |
| `components/case/CaseListView` | `components/case/case-list-view.tsx` | P0 | **done** |
| `components/case/CaseListCard` | `components/case/case-list-card.tsx` | P0 | **done** |
| `components/case/CreateCaseDialog` | `components/case/create-case-dialog.tsx` | P0 | **done** |
| `components/case/DeleteCaseConfirmationDialog` | `components/case/delete-case-confirmation-dialog.tsx` | P0 | **done** |
| `components/case/EditCaseDialog` | `components/case/edit-case-dialog.tsx` | P0 | planned (U3 tail) |
| `components/workspace/CaseWorkspace` | `components/workspace/case-workspace.tsx` | P0 | planned (U4) |
| `components/workspace/WorkspaceLayout` | `components/workspace/workspace-layout.tsx` | P0 | planned |
| `components/workspace/FileNavigator` | `components/workspace/file-navigator.tsx` | P0 | planned |
| `components/workspace/SplitView` | `components/workspace/split-view.tsx` | P0 | planned |
| `components/workspace/IntegratedFileViewer` | `components/viewer/*` | P0/P1 | planned (U5) |
| `components/board/WorkflowBoard` | `components/review/file-table.tsx` or board | P0 | planned (U7) |
| `components/notes/NotePanel` | `components/artifacts/note-panel.tsx` | P0 | planned (U6) |
| `components/findings/FindingsPanel` | `components/artifacts/findings-panel.tsx` | P0 | planned |
| `components/timeline/TimelineView` | `components/artifacts/timeline-panel.tsx` | P0 | planned |
| `components/search/SearchDialog` | `components/search/search-dialog.tsx` | P0 | planned (U10) |
| `components/time/TimerWidget` | `components/billing/timer-widget.tsx` | P0 | planned (U8) |
| `components/reports/ReportView` | `components/reports/report-view.tsx` | P0 | planned (U9) |
| `src/services/*` | `lib/services/*` | P0 | planned |
| `src/hooks/*` | `lib/hooks/*` | P0 | planned |
| `src/store/*` | `lib/state/*` | P0 | planned |
| `components/mapping/*` | — | P1 | defer |
| `components/duplicates/*` | `components/duplicates/*` | P1 | defer |

## Adapter boundary

```
UI Component → lib/hooks → lib/services → command-client → Tauri
```

No `invoke()` in components. Expand `lib/command-client.ts` as each surface ships.

## Current v2 state

| Route / file | Behavior |
|--------------|----------|
| `app/page.tsx` | Case hub — `CaseListView` |
| `app/case/page.tsx` + `page-client.tsx` | Legacy `components/case-workspace.tsx` (monolithic; not v1 layout) |
| `lib/command-client.ts` | Typed wrappers for P0 backend commands |
| `lib/tauri-dialog.ts` | Native folder/file pickers (`tauri-plugin-dialog`) |

## P0 screen flow (target)

1. `/` — Case list (hub) ✅
2. `/case?id=` — Workspace (navigator \| viewer \| side panels) — U4+
3. Modals: create ✅, delete ✅, edit/large-folder — U3 tail
4. Command palette: global search — U10

## Drop from v1 UI at launch

- Legacy `case-workspace.tsx` demo sections (remove in U11)
- Enterprise filters on case list (unless U3 tail)
- Full kanban board (simplify to table/swimlanes)
- Settings sprawl (minimal P0)

See [spec/user-flow-map.md](spec/user-flow-map.md) and [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md).
