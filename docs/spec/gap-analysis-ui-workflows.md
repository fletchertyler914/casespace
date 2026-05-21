# UI and Workflow Gap Analysis (v1 -> v2)

## Scope and source refs

- **v1:** `inventory-generator/src/` — `App.tsx`, `components/workspace/*`, `services/*`, `hooks/*`, `store/*`
- **v2:** `casespace/apps/desktop/` — case hub in `components/case/*`; legacy `case-workspace.tsx` on `/case`; active plan [ui-port-plan.md](../ui-port-plan.md)

## UX invariants to preserve exactly

See [user-flows-and-ux-invariants.md](user-flows-and-ux-invariants.md) UX-001 through UX-010.

## Flow inventory table

| flow_id | flow_name | v1 components/hooks | v2 status | classification | launch tier | recommendation | requirement_id | test |
|---------|-----------|---------------------|-----------|----------------|-------------|----------------|----------------|------|
| UI-001 | Case hub | `CaseListView`, `App.tsx` | **partial** (U3) | portable-with-redesign | P0 | rewrite | REQ-CASE-001 | e2e |
| UI-002 | Create case | `CreateCaseDialog` | **partial** (U3) | portable-with-redesign | P0 | rewrite | REQ-CASE-001 | e2e |
| UI-003 | Open case / ingest | `App.tsx`, `fileService` | partial (legacy workspace) | portable-with-redesign | P0 | rewrite | REQ-INGEST-001 | e2e |
| UI-004 | Workspace shell | `CaseWorkspace`, `WorkspaceLayout` | missing (U4) | portable-with-redesign | P0 | rewrite | REQ-VIEW-001 | e2e |
| UI-005 | File navigator | `FileNavigator` | missing | portable-with-redesign | P0 | rewrite | REQ-REVIEW-001 | e2e |
| UI-006 | Viewer | `IntegratedFileViewer` | missing | not-portable-replace | P0 | rewrite | REQ-VIEW-001 | e2e |
| UI-007 | Review status | `WorkflowBoard` / table | missing | portable-with-redesign | P0 | rewrite | REQ-REVIEW-001 | e2e |
| UI-008 | Notes panel | `NotePanel` | missing | portable-with-redesign | P0 | rewrite | REQ-ARTIFACT-001 | integration |
| UI-009 | Findings panel | `FindingsPanel` | missing | portable-with-redesign | P0 | rewrite | REQ-ARTIFACT-001 | integration |
| UI-010 | Timeline | `TimelineView` | missing | portable-with-redesign | P0 | rewrite | REQ-ARTIFACT-001 | integration |
| UI-011 | Search palette | `SearchDialog`, `useSearch` | missing | portable-with-redesign | P0 | rewrite | REQ-SEARCH-001 | e2e |
| UI-012 | Timer widget | `TimerWidget` | missing | portable-with-redesign | P0 | rewrite | REQ-TIME-001 | e2e |
| UI-013 | Reports | `ReportView` | missing | portable-with-redesign | P0 | rewrite | REQ-REPORT-001 | e2e |
| UI-014 | Duplicates UI | `duplicates/*` | missing | missing-in-v2 | P1 | rewrite | REQ-INGEST-001 | e2e |
| UI-015 | Settings | `SettingsDialog` | missing | missing-in-v2 | P1 | defer | REQ-CASE-001 | — |
| UI-016 | Scaffold demo | `case-workspace.tsx` | exists | not-portable-replace | — | drop | — | — |

## Portable-as-is

- `useWorkflowSelection` logic (index-based multi-select)
- `useFileNavigation` tree order navigation
- `baseService` retry/cache pattern (adapt to command-client)
- Pure utils: `file-tree-utils`, billing utils

## Portable-with-redesign

- Zustand stores → `lib/state/*`
- Services → `lib/services/*` wrapping command-client
- Panel layout → smaller composable components
- Search hook debounce/caps

## Not-portable-replace

- `IntegratedFileViewer` monolith → split viewers
- `WorkflowBoard` 900-line kanban → table-first P0
- Vite `App.tsx` bootstrap → Next.js layouts
- `case-workspace.tsx` demo UI

## Missing-in-v2

Entire workspace: navigator, viewer, panels, case list, dialogs, timer, reports, duplicates, settings.

## Elite simplification decisions

| Remove/simplify | Preserve outcome |
|-----------------|------------------|
| Enterprise case filters | Search + sort |
| Full kanban P0 | Table + status |
| Mapping wizard launch | Defer P1 |
| 20+ shadcn primitives | Minimal `packages/ui` set |
| In-app PDF P0 | Text/image + external open |

## UI execution cut (P0/P1/P2)

**P0:** Case hub, workspace 3-pane, navigator, viewer MVP, status, notes/findings/timeline panels, search palette, timer, report export UI

**P1:** Duplicates, auto-sync warnings, PDF viewer, settings drawer, metadata panel

**P2:** Kanban board, rich Tiptap, time management calendar page
