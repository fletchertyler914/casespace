# Migrating From v1 to v2

This guide defines the deterministic migration/rebuild strategy from:

- v1: `/Users/tyler/projects/malissa_projects/inventory-generator` (React/Vite + Tauri 2)
- v2: `/Users/tyler/projects/malissa_projects/casespace`

**Canonical specs:** [product-spec-bible.md](product-spec-bible.md) · [command-parity-ledger.md](command-parity-ledger.md) · [gap-analysis-master.md](spec/gap-analysis-master.md)

**Execution order:** CoreParity (non-AI) → E2E validation → AINative (blocked until [Core Parity gate](implementation-readiness-gate.md#core-parity-build-gate))

## Strategic posture

- v2 is a net-new rebuild, not a binary-compatible migration.
- Business intent and user outcomes from v1 are preserved.
- Implementation details, schemas, naming, package boundaries, and runtime shape can be redesigned.
- v2 architecture target is 3-app:
  - `apps/desktop-backend` (Tauri/Rust core engine)
  - `apps/desktop` (Next.js desktop UX)
  - `apps/web` (marketing/sales/docs/download surface; no product workspace UI)

## Non-negotiable principles

1. Preserve user-value outcomes from v1 core workflows.
2. Never regress security posture during rewrite.
3. Meet or exceed performance SLOs defined from v1 baseline.
4. Keep modular boundaries explicit and enforceable.
5. Build cost-aware and extension-ready foundations first.

## Elite migration phases

### Phase A: Baseline and observability

- Capture baseline behavior and performance from v1 core flows.
- Freeze domain-level acceptance criteria before major rewrites.

### Phase B: Backend reconstruction

- Rebuild command layer and persistence model in `apps/desktop-backend`.
- Re-implement domain capabilities by contract, not by file copy.

### Phase C: Desktop UX reconstruction

- Rebuild analyst workflows in `apps/desktop` (Next.js).
- Introduce stable command-adapter/client boundary.

### Phase D: Hardening gates

- Security reviews for risky commands and permissions.
- Performance regression gating against agreed thresholds.
- Reliability checks and rollback procedures.

### Phase E: Modularization and scale

- Extract proven shared boundaries into `packages/*`.
- Add extension seams (feature flags, module interfaces, capability toggles).

### Phase F: 3-app architecture completion

- Lock ownership boundaries for desktop-backend vs desktop vs web.
- Ensure desktop and web can evolve independently without hidden coupling.

## Implementation manifest (status-tagged)

**Status vocabulary:** `exists` | `planned` | `deferred` | `N/A`  
Command-level detail: [command-parity-ledger.md](command-parity-ledger.md)

### File-by-file mapping

| v1 source | v2 target | Status | Notes |
| --------- | --------- | ------ | ----- |
| `src-tauri/src/lib.rs` | `src-tauri/src/lib.rs` (interim) → `commands/*` | exists / planned | Monolithic today; split planned |
| `src-tauri/src/database.rs` | `src-tauri/src/database.rs` | planned | SQLite + FTS |
| `src-tauri/src/time_tracking.rs` | `src-tauri/src/time_tracking.rs` | planned | REQ-TIME-001 |
| `src-tauri/src/scanner.rs` | `src-tauri/src/scanner.rs` | planned | REQ-INGEST-001 |
| `src-tauri/src/file_ingestion.rs` | `src-tauri/src/file_ingestion.rs` | planned | REQ-INGEST-001 |
| `src-tauri/src/repositories/*` | `src-tauri/src/repositories/*` | planned | After schema freeze |
| `src/components/workspace/*` | `apps/desktop/components/workspace/*` | planned | P0 CoreParity |
| `src/components/viewer/*` | `apps/desktop/components/viewer/*` | planned | MVP P0, rich P1 |
| `src/components/notes/*` | `apps/desktop/components/artifacts/*` | planned | REQ-ARTIFACT-001 |
| `src/components/findings/*` | `apps/desktop/components/artifacts/*` | planned | REQ-ARTIFACT-001 |
| `src/components/timeline/*` | `apps/desktop/components/artifacts/*` | planned | REQ-ARTIFACT-001 |
| `src/components/search/*` | `apps/desktop/components/search/*` | planned | REQ-SEARCH-001 |
| `src/components/duplicates/*` | `apps/desktop/components/duplicates/*` | deferred | P1 |
| `src/components/time/*` | `apps/desktop/components/billing/*` | planned | REQ-TIME-001 |
| `src/services/*` | `apps/desktop/lib/services/*` | planned | Adapter layer |
| `src/hooks/*` | `apps/desktop/lib/hooks/*` | planned | Port logic |
| `src/store/*` | `apps/desktop/lib/state/*` | planned | Zustand |
| `src/types/*` | `packages/types/*` | exists / planned | Partial contracts |
| `src/components/ui/*` | `packages/ui/src/*` | exists / planned | Starter only today |
| `public/*` (owl assets) | `apps/desktop/public/*` | exists | Branding ported |
| `vite.config.ts` | N/A | N/A | Next.js desktop |
| `index.html` | N/A | N/A | Next.js desktop |
| `.github/workflows/build.yml` | `.github/workflows/ci.yml`, `release.yml` | exists | Node 24 |
| `scripts/*` | `scripts/*` | exists / planned | Icon gen, release scripts exist |

### Rename ledger

| Legacy concept               | v2 canonical name                            | Reason                          |
| ---------------------------- | -------------------------------------------- | ------------------------------- |
| v1 single app boundary       | `desktop-backend` + `desktop` split          | Explicit domain vs UX ownership |
| ad hoc service naming        | `DomainService` modules under `lib/services` | Consistent architecture         |
| mixed mapping config objects | typed domain contracts in `packages/types`   | Shared compile-time safety      |
| implicit command names       | versioned command contract naming            | safer long-term evolution       |

### Refactor worklist

| Work item                                  | Risk   | Dependency                | Rollback strategy                       |
| ------------------------------------------ | ------ | ------------------------- | --------------------------------------- |
| Rebuild DB schema and migrations           | High   | Phase A baselines         | Keep migration snapshots + rollback SQL |
| Recompose command surface by domains       | High   | schema + domain contracts | Keep temporary compatibility adapter    |
| Next desktop workflow reconstruction       | High   | command contracts         | Feature flags per workflow              |
| Shared type extraction to `packages/types` | Medium | domain contract freeze    | Keep app-local fallback typings         |
| UI system extraction to `packages/ui`      | Medium | desktop UX stabilization  | maintain in-app components until stable |
| CI/release rewrite for monorepo            | Medium | package/task scripts      | run dual pipeline during cutover        |

### Net-new code inventory

Expected net-new artifacts:

- `apps/desktop/lib/commands/*` (client adapters)
- `apps/desktop/lib/contracts/*` (typed API contracts)
- `apps/desktop/lib/workflows/*` (workflow orchestration modules)
- `apps/desktop-backend/src-tauri/src/commands/*` (domain command modules)
- `apps/desktop-backend/src-tauri/src/domain/*` (business rule layer)
- `apps/desktop-backend/src-tauri/src/persistence/*` (storage modules)
- `packages/types/*` (shared domain contracts)
- `packages/ui/*` (shared design system primitives)
- `.github/workflows/ci.yml` and release workflow(s)

### Acceptance checks

Each manifest item is considered implemented and validated only when:

- code compiles in the owning package(s)
- tests for that domain pass
- security review checklist is satisfied
- performance SLOs are met or approved exception exists
- owning docs section is updated

## Command/API contract matrix

The matrix below maps v1 capabilities to v2 owners and enforcement criteria.

| Capability            | v1 command(s)                                                                                                                                                       | v2 contract target           | Calling layer                        | Security constraints                          | Performance SLO                                | Test strategy                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------ | --------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| Case management       | `create_case`, `list_cases`, `get_case`, `update_case_metadata`, `delete_case`                                                                                      | `CaseCommandService`         | `apps/desktop` workflow modules      | explicit authz checks for destructive ops     | list < 150ms target                            | unit + integration + destructive-op tests  |
| Inventory ingest/sync | `count_directory_files`, `scan_directory`, `sync_inventory`, `ingest_files_to_case`                                                                                 | `InventoryIngestionService`  | desktop workflow + backend scheduler | path canonicalization and scope validation    | 100 files ingest within target baseline budget | load tests + fixture-based parity tests    |
| Notes                 | `create_note`, `update_note`, `delete_note`, `list_notes`, `toggle_note_pinned`                                                                                     | `NotesService`               | notes UI + command adapter           | sanitize rich content inputs                  | CRUD under interactive latency budget          | unit + UI + persistence tests              |
| Findings              | `create_finding`, `update_finding`, `delete_finding`, `list_findings`                                                                                               | `FindingsService`            | findings UI                          | validate links and references                 | list/filter under interactive budget           | unit + integration                         |
| Timeline              | `create_timeline_event`, `update_timeline_event`, `delete_timeline_event`, `list_timeline_events`                                                                   | `TimelineService`            | timeline UI                          | immutable audit metadata where needed         | timeline load under budget                     | unit + integration                         |
| Search                | `search_files`, `search_notes`, `search_all`                                                                                                                        | `SearchQueryService`         | global search modules                | query sanitization + bounded query complexity | query p95 target from baseline                 | query correctness + perf tests             |
| Duplicates            | `find_duplicate_files`, `find_all_duplicate_groups`, `mark_duplicate_primary`, `merge_duplicate_metadata`                                                           | `DuplicateResolutionService` | duplicate workflow                   | guarded merge/primary transitions             | duplicate scans within batch budget            | integration + mutation safety tests        |
| File ops              | `open_file`, `read_file_base64`, `read_file_text`, `write_file_text`, `rename_file`, `remove_file_from_case`                                                        | `FileOpsService`             | viewer/editor flows                  | strict path policy + capability minimization  | file open/read p95 targets                     | security tests + integration               |
| Config/preferences    | `get_column_config_db`, `save_column_config_db`, `get_mapping_config_db`, `save_mapping_config_db`, `get_workspace_preferences_db`, `save_workspace_preferences_db` | `WorkspaceConfigService`     | settings/workspace modules           | validate schema payloads                      | settings read/write interactive                | unit + schema validation tests             |
| Time/billing          | `start_timer`, `pause_timer`, `resume_timer`, `stop_timer`, `get_time_entries`, `calculate_billing_amount`, `calculate_case_total`                                  | `TimeBillingService`         | time UI and reports                  | idempotent timer transitions                  | timer actions interactive; summaries bounded   | unit + integration + edge-case timer tests |
| Update/release hooks  | updater/process flows                                                                                                                                               | `ReleaseUpdateService`       | desktop settings/admin               | signature and channel validation              | update check latency budget                    | e2e + staged rollout tests                 |

## Command-risk appendix

### High-risk destructive commands

- `delete_case`
- `rename_file`
- `remove_file_from_case`
- `merge_duplicate_metadata`

Required controls:

- explicit confirmation UX
- command-level guardrails
- audit logging
- rollback capability where practical

### Host file read/write/open commands

- `write_file_text`
- `read_file_base64`
- `read_file_text`
- `open_file`

Required controls:

- centralized path canonicalization
- blocked traversal and unsafe path patterns
- capability scope minimization
- test fixtures for malicious path inputs

### Bulk/background operations

- `sync_inventory`
- `sync_case_all_sources`
- `refresh_files_bulk`
- ingestion pipelines

Required controls:

- bounded concurrency
- cancellation support
- resumable progress and idempotency

### Search surface

- `search_files`
- `search_notes`
- `search_all`

Required controls:

- query sanitization
- bounded query complexity
- p95 latency guardrails and regression alerting

## Business strategy alignment (closed source now, hybrid later)

- Keep core closed during v2 stabilization.
- Build extension seams now so monetization remains additive:
  - enterprise support/integration offerings
  - premium modules (AI/compliance/advanced workflows)
  - optional hosted team features later
- Do not entangle monetization logic into core domain rules.

## Elite target architecture (backend domains)

Planned module layout under `apps/desktop-backend/src-tauri/src/`:

| Domain | Responsibility |
|--------|----------------|
| `commands/cases` | Case CRUD, sources |
| `commands/ingest` | Scan, ingest, sync, refresh |
| `commands/files` | Read/write/open, status |
| `commands/search` | FTS queries |
| `commands/artifacts` | Notes, findings, timeline |
| `commands/duplicates` | Groups, merge (P1) |
| `commands/billing` | Timer, segments, invoice math |
| `commands/config` | Workspace prefs (P1) |
| `persistence/*` | SQLite pool, migrations, repositories |
| `domain/*` | Business rules, validation |

Desktop: `lib/services` → `lib/hooks` → `components/*`. See [desktop-workflow-mapping.md](desktop-workflow-mapping.md).

## Definition of done for migration planning

Planning phase complete when:

1. [product-spec-bible.md](product-spec-bible.md) and `docs/spec/*` pack exist ✅
2. [command-parity-ledger.md](command-parity-ledger.md) maps v1 commands ✅
3. [implementation-readiness-gate.md](implementation-readiness-gate.md) published ✅

Implementation phase complete when Core Parity Build Gate passes (see readiness doc).
