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

## Phase 2: Core Parity (non-AI) — complete (local)

- [x] Shared contracts package (`@repo/types`)
- [x] SQLite + migrations + FTS (`database.rs`, `casespace.db`)
- [x] JSON store migration on first launch
- [x] Command-risk baseline path checks
- [x] P0 command slice (cases, ingest, files, artifacts, search, timer, billing, reports)
- [x] Desktop command adapter + core workspace UI
- [x] Parity integration suite (`pnpm test:parity`)
- [x] Hardening suite (`pnpm test:hardening`) with golden seed + malformed-store + 10k ingest stress
- [x] Full P0 command matrix per [command-parity-ledger.md](command-parity-ledger.md)
- [x] Case hub + workspace route split; image viewer in workspace (PDF remains P1)
- [x] E2E parity suite per [spec/test-oracle-matrix.md](spec/test-oracle-matrix.md) (`pnpm test:parity`)
- [x] **Core Parity Build Gate passed** ([implementation-readiness-gate.md](implementation-readiness-gate.md))

## Phase 3: AINative (ready)

Core Parity gate passed locally; safe to begin AINative workstream.

- [ ] AI capability matrix implemented
- [ ] PII policy enforced per case
- [ ] No regression on CoreParity metrics

See [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md) and [spec/out-of-scope.md](spec/out-of-scope.md).
