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

## Phase 2b: Core Parity UX port (in progress)

Active workstream. Backend commands exist; v1-shaped UI is ported to `apps/desktop`.

### Complete

- [x] **U1** Foundation — OKLCH tokens, providers, theme, splash, utils
- [x] **U2** shadcn primitives (22 components)
- [x] **U3** Case hub — `CaseListView`, cards, create/delete dialogs, `/` route
- [x] **U4** Workspace shell — layout, header, navigator, split/board, ingest/sync UI
- [x] **U5** Viewers — PDF/DOCX/XLSX in-app; image/text/markdown/CSV; external for unsupported only
- [x] **U6** Artifact panels MVP — notes/findings/timeline CRUD (notes pin included)
- [x] DevX — `pnpm dev` = full Tauri; Next 16.2.6 catalog pin

### Next

- [ ] **U3 tail** — Edit case, large-folder warning, filters (optional)
- [ ] **U7** Board / review + duplicate groups UI (**in progress**: duplicates panel MVP + set primary + merge metadata + swimlanes + drag/drop)
- [ ] **U8** Time management UI (**in progress**: timer widget + time panel MVP)
- [ ] **U9** Reports UI (**in progress**: reports panel MVP + export actions)
- [ ] **U10** Search palette (cmdk) + settings (**in progress**: cmdk + workspace settings dialog wired)
- [ ] **U11** UX gate validation + final cleanup sweep

Detail: [ui-port-plan.md](ui-port-plan.md).

**Routing:** `/case?id=` → `case-workspace-shell.tsx`. Legacy `components/case-workspace.tsx` has been removed.

## Phase 3: AINative (blocked)

Blocked until **UX Parity Build Gate** passes ([ui-port-plan.md](ui-port-plan.md)).

- [ ] AI capability matrix implemented
- [ ] PII policy enforced per case
- [ ] No regression on CoreParity backend metrics

See [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md) and [spec/out-of-scope.md](spec/out-of-scope.md).
