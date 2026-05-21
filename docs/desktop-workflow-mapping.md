# Desktop Workflow Mapping (v1 UI → v2)

## v1 → v2 component map

| v1 path | v2 target | Phase | Action |
|---------|-----------|-------|--------|
| `src/App.tsx` | `app/layout.tsx` + case routes | P0 | rewrite |
| `components/case/CaseListView` | `components/case/case-list.tsx` | P0 | rewrite |
| `components/case/CreateCaseDialog` | `components/case/create-case-dialog.tsx` | P0 | rewrite |
| `components/workspace/CaseWorkspace` | `components/workspace/case-workspace.tsx` | P0 | rewrite |
| `components/workspace/WorkspaceLayout` | `components/workspace/workspace-layout.tsx` | P0 | rewrite |
| `components/workspace/FileNavigator` | `components/workspace/file-navigator.tsx` | P0 | rewrite |
| `components/workspace/SplitView` | `components/workspace/split-view.tsx` | P0 | rewrite |
| `components/workspace/IntegratedFileViewer` | `components/viewer/*` | P0/P1 | rewrite split |
| `components/board/WorkflowBoard` | `components/review/file-table.tsx` | P0 | simplify |
| `components/notes/NotePanel` | `components/artifacts/note-panel.tsx` | P0 | rewrite |
| `components/findings/FindingsPanel` | `components/artifacts/findings-panel.tsx` | P0 | rewrite |
| `components/timeline/TimelineView` | `components/artifacts/timeline-panel.tsx` | P0 | rewrite |
| `components/search/SearchDialog` | `components/search/command-palette.tsx` | P0 | rewrite |
| `components/time/TimerWidget` | `components/billing/timer-widget.tsx` | P0 | rewrite |
| `components/reports/ReportView` | `components/reports/report-view.tsx` | P0 | rewrite |
| `src/services/*` | `lib/services/*` | P0 | rewrite |
| `src/hooks/*` | `lib/hooks/*` | P0 | port logic |
| `src/store/*` | `lib/state/*` | P0 | rewrite |
| `components/mapping/*` | — | P1 | defer |
| `components/duplicates/*` | `components/duplicates/*` | P1 | rewrite |

## Adapter boundary

```
UI Component → lib/hooks → lib/services → command-client → Tauri
```

No `invoke()` in components. Expand `command-client.ts` to cover P0 commands in [command-parity-ledger.md](command-parity-ledger.md).

## Current v2 state

- `apps/desktop/app/page.tsx` → `case-workspace.tsx` (demo only)
- `command-client.ts` exposes ~8 commands

## P0 screen flow

1. `/` — Case list (hub)
2. `/case/[id]` — Workspace (navigator | viewer | side panel)
3. Modals: create case, delete confirm, large folder warn
4. Command palette: global search

## Drop from v1 UI at launch

- `case-workspace.tsx` demo sections (OCR/report test UI)
- Enterprise filters on case list
- Full kanban board
- Settings sprawl

See [spec/user-flow-map.md](spec/user-flow-map.md) and [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md).
