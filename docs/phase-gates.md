# Phase Gate Checklist

Linked to [product-spec-bible.md](product-spec-bible.md), [implementation-readiness-gate.md](implementation-readiness-gate.md), and [ui-port-plan.md](ui-port-plan.md).

## Phase 0: Planning and spec (complete)

- [x] Product Spec Bible + `docs/spec/*` pack
- [x] Gap analysis (backend, UI, data, deps, master)
- [x] Command parity ledger + persistence + workflow mapping
- [x] Parity-first sequencing (AI deferred until UX gate)
- [x] Implementation readiness gate document

## Phase 1: Deployment pipeline

- [x] CI workflow definitions and architecture guard
- [x] Release workflow definitions and deterministic asset naming
- [x] Web download page with release-aware resolver
- [x] Rollback runbook drafted
- [x] Node 24 toolchain policy (engines, CI, `.nvmrc`)
- [ ] Live GitHub Actions CI matrix proven green on Node 24 (post-push)
- [ ] Live release publishing with multi-arch artifacts
- [ ] Live download links validated against stable release

## Phase 2: Core Parity backend (complete — local)

- [x] Shared contracts package (`@repo/types`)
- [x] SQLite + migrations + FTS (`database.rs`, `casespace.db`)
- [x] JSON store migration on first launch
- [x] Command-risk baseline path checks
- [x] P0 command slice per [command-parity-ledger.md](command-parity-ledger.md)
- [x] Parity integration suite (`pnpm test:parity`)
- [x] Hardening suite (`pnpm test:hardening`)
- [x] **Core Parity backend Build Gate** — [implementation-readiness-gate.md](implementation-readiness-gate.md)

## Phase 2b: Core Parity UX port (in progress)

Active workstream. Backend commands exist; v1-shaped UI is being ported to `apps/desktop`.

### Complete

- [x] **U1** Foundation — OKLCH tokens, providers, theme, splash, utils
- [x] **U2** shadcn primitives (22 components)
- [x] **U3** Case hub — `CaseListView`, cards, create/delete dialogs, `/` route
- [x] DevX — `pnpm dev` = full Tauri; `dev:next` avoids port 3000 conflict

### In progress / next

- [ ] **U3 tail** — Edit case, large-folder warning, filters (optional before U4)
- [ ] **U4** Workspace shell — layout, header, file navigator, split view
- [ ] **U5** Viewers — text/image/CSV P0; PDF/DOCX/XLSX P1
- [ ] **U6** Artifact panels — notes, findings, timeline
- [ ] **U7** Board / review table
- [ ] **U8** Time management UI
- [ ] **U9** Reports UI
- [ ] **U10** Search palette + settings
- [ ] **U11** UX gate validation + remove legacy `case-workspace.tsx`

Detail: [ui-port-plan.md](ui-port-plan.md).

**Interim:** `/case?id=` uses legacy `components/case-workspace.tsx` (functional demo, not v1 UX).

## Phase 3: AINative (blocked)

Blocked until **UX Parity Build Gate** passes ([ui-port-plan.md](ui-port-plan.md)).

- [ ] AI capability matrix implemented
- [ ] PII policy enforced per case
- [ ] No regression on CoreParity backend metrics

See [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md) and [spec/out-of-scope.md](spec/out-of-scope.md).
