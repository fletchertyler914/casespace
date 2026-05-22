# User Flows and UX Invariants

Launch wedge: **CFE / fraud examination** (primary client). See [cfe-workflows.md](cfe-workflows.md). Phase: **CoreParity** unless noted.

## UX invariants (must not regress)

| ID | Invariant | Source (v1) |
|----|-----------|---------------|
| UX-001 | Case list is home; opening a case enters workspace | `App.tsx` |
| UX-002 | Closing case clears selection state | `App.tsx` |
| UX-003 | Timer stops when switching cases | `App.tsx` |
| UX-004 | Five file statuses: unreviewed → in progress → reviewed → flagged → excluded | `WorkflowBoard` / types |
| UX-005 | Cmd/Ctrl+K opens global search; Enter navigates to hit | `SearchDialog` |
| UX-006 | Next/previous file follows tree order | `useFileNavigation` |
| UX-007 | Large folder warning before bulk ingest (> threshold) | `LargeFolderWarningDialog` |
| UX-008 | Destructive actions require confirmation dialog | case/file/delete dialogs |
| UX-009 | Folder filter scopes inventory to subtree | `CaseWorkspace` |
| UX-010 | Split or board view persists per user | workspace prefs |

## P0 flows (CoreParity)

### FLOW-001: Case setup and ingest

| Step | Actor | System | Success criteria |
|------|-------|--------|------------------|
| 1 | User | Create case with name + source path(s) | Case persisted with sources |
| 2 | User | Open case | Inventory loads from DB; empty → ingest prompt |
| 3 | System | Ingest directory | Files indexed with metadata; progress shown |
| 4 | System | Warn if folder > N files | User confirms before full ingest |
| 5 | User | View file count in navigator | Matches DB count |

**Failure paths:** invalid path, permission denied, ingest cancelled, partial ingest recoverable  
**Tests:** integration ingest, e2e case open  
**AI:** none (CoreParity)

### FLOW-002: Review and triage

| Step | Actor | System |
|------|-------|--------|
| 1 | User | Select file in navigator |
| 2 | System | Open preview (text/image MVP; PDF P1) |
| 3 | User | Set review status |
| 4 | User | Filter by status / folder |
| 5 | User | Next/prev file |

**Tests:** e2e review loop

### FLOW-003: Artifacts (notes, findings, timeline)

| Step | Actor | System |
|------|-------|--------|
| 1 | User | Create note (optional file link) |
| 2 | User | Create finding with title/description |
| 3 | User | Add timeline event |
| 4 | User | Edit/delete artifacts (P0: create+list; update/delete P0 target) |

**Tests:** integration CRUD

### FLOW-004: Search

| Step | Actor | System |
|------|-------|--------|
| 1 | User | Cmd/Ctrl+K, type query |
| 2 | System | Ranked results: files, notes, findings, timeline |
| 3 | User | Navigate to selection |

**Tests:** integration FTS, e2e search navigate

### FLOW-005: Report assembly (non-AI)

| Step | Actor | System |
|------|-------|--------|
| 1 | User | Open report view for case |
| 2 | System | Aggregate artifacts + file index |
| 3 | User | Generate examination report (findings, timeline, evidence index, executive summary) |

**Tests:** e2e export smoke

### FLOW-006: Time and billing

| Step | Actor | System |
|------|-------|--------|
| 1 | User | Start timer on case (visible in header) |
| 2 | User | Stop timer; entry recorded |
| 3 | User | Configure rates/categories (v1 parity level) |
| 4 | User | Export billing/invoice package |

**Tests:** integration timer, billing calc unit tests

## P1 flows (post CoreParity gate)

- Duplicate triage UI
- Auto-sync on interval + file-changed warnings
- Full PDF viewer in-app
- Case metadata edit, mapping wizard (if required)
- Rich kanban board (optional; table-first for P0)

## AI-phase flows (blocked until parity gate)

See [ai-capability-matrix.md](ai-capability-matrix.md) and [user-flow-map.md](user-flow-map.md).

## Elite simplification (intentional)

| v1 | v2 launch |
|----|-----------|
| 900-line WorkflowBoard | Table + status column |
| 1800-line IntegratedFileViewer | Split viewers by mime |
| Case list enterprise filters | Search + sort only |
| Settings sprawl | Single preferences drawer |

## Screen ownership (target)

| Screen | v2 path |
|--------|---------|
| Case hub | `apps/desktop/app/page.tsx` or `/cases` |
| Workspace | `apps/desktop/components/workspace/*` |
| Viewer | `apps/desktop/components/viewer/*` |
| Reports | `apps/desktop/components/reports/*` |

See [desktop-workflow-mapping.md](../desktop-workflow-mapping.md).
