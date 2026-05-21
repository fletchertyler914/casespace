# Phase Gate Checklist

Linked to [product-spec-bible.md](product-spec-bible.md) and [implementation-readiness-gate.md](implementation-readiness-gate.md).

## Phase 0: Planning and spec (complete)

- [x] Product Spec Bible + `docs/spec/*` pack
- [x] Gap analysis (backend, UI, data, deps, master)
- [x] Command parity ledger + persistence + workflow mapping
- [x] Parity-first sequencing (AI deferred)
- [x] Implementation readiness gate document

## Phase 1: Deployment pipeline

- [x] CI workflow definitions and architecture guard
- [x] Release workflow definitions and deterministic asset naming
- [x] Web download page with release-aware resolver
- [x] Rollback runbook drafted
- [x] Node 24 toolchain policy (engines, CI, `.nvmrc`)
- [ ] Live GitHub Actions CI matrix proven green on Node 24
- [ ] Live release publishing with multi-arch artifacts
- [ ] Live download links validated against stable release

## Phase 2: Core Parity (non-AI) — in progress

- [x] Shared contracts package (`@repo/types`)
- [x] Backend command scaffolding (JSON store — replace with SQLite)
- [x] Command-risk baseline path checks
- [x] Desktop command adapter (partial)
- [ ] SQLite + migrations + FTS
- [ ] Full P0 command matrix per [command-parity-ledger.md](command-parity-ledger.md)
- [ ] Case hub + workspace UI (navigator, viewer MVP, panels)
- [ ] P0 E2E workflow tests per [spec/test-oracle-matrix.md](spec/test-oracle-matrix.md)
- [ ] **Core Parity Build Gate passed** ([implementation-readiness-gate.md](implementation-readiness-gate.md))

## Phase 3: AINative (blocked)

Blocked until Phase 2 Core Parity gate passes.

- [ ] AI capability matrix implemented
- [ ] PII policy enforced per case
- [ ] No regression on CoreParity metrics

See [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md) and [spec/out-of-scope.md](spec/out-of-scope.md).
