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
- [x] Next.js 16.2.6 catalog pin + lockfile discipline
- [ ] Live GitHub Actions CI matrix proven green on Node 24 (post-push)
- [ ] Live release publishing with multi-arch artifacts
- [ ] Live download links validated against stable release

## Phase 2: Core Parity backend (complete — local)

- [x] Shared contracts package (`@repo/types`)
- [x] SQLite + migrations + FTS (`database.rs`, `casespace.db`)
- [x] JSON store migration on first launch
- [x] Ingest v2 (`source_path`, multi-source, incremental sync, duplicate rebuild)
- [x] Command-risk baseline path checks
- [x] P0 command slice per [command-parity-ledger.md](command-parity-ledger.md)
- [x] Parity integration suite (`pnpm test:parity`)
- [x] Hardening suite (`pnpm test:hardening`)
- [x] **Core Parity backend Build Gate** — [implementation-readiness-gate.md](implementation-readiness-gate.md)

## Phase 2b: Core Parity UX port (implemented — gate validation pending)

v1 parity closure landed in `apps/desktop` for v0.1.7 (2026-05-21). Automated local gates pass; **UX Parity Build Gate** requires manual E2E.

### Complete (code)

- [x] **U1–U2** Foundation + primitives
- [x] **U3** Case hub + edit case + large-folder warning
- [x] **U4** Workspace shell + file table + mapping/columns dialog
- [x] **U5** Viewers — depth (metadata, rename/delete, code highlight, image zoom, XLSX tabs)
- [x] **U6** Tiptap notes/findings + timeline controls
- [x] **U7** Duplicates depth (management panel, merge relink, badges)
- [x] **U8** Time segments + billing dialogs
- [x] **U9** Reports workspace + export history
- [x] **U10** Structured search + app settings
- [x] DevX — `pnpm dev`, vitest, Next 16.2.6 catalog pin

### Next (post v0.1.7)

- [ ] **U11** UX gate — [spec/native-e2e-checklist.md](spec/native-e2e-checklist.md) in `pnpm dev` (see [spec/v1-parity-closeout.md](spec/v1-parity-closeout.md))
- [ ] Board multi-select / lane filters / rich cards (optional depth)
- [ ] Report PDF/DOCX exports (deferred)
- [ ] Production signing + live updater keys

Detail: [ui-port-plan.md](ui-port-plan.md).

**Routing:** `/case?id=` → `case-workspace-shell.tsx`. Legacy `components/case-workspace.tsx` has been removed.

## Phase 3: AINative (blocked)

Blocked until **UX Parity Build Gate** passes ([ui-port-plan.md](ui-port-plan.md)).

- [ ] AI capability matrix implemented
- [ ] PII policy enforced per case
- [ ] No regression on CoreParity backend metrics

See [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md) and [spec/out-of-scope.md](spec/out-of-scope.md).
