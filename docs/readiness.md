# CaseSpace v2 Readiness

This document states what the v2 repository is ready for now and what must be completed before core migration/rebuild execution is considered production-ready.

## Executive status

- Repository state: foundation scaffold
- Migration state: planning complete, implementation not started
- Core readiness: partial (tooling and structure exist, product behavior does not yet)

## Readiness matrix

| Area | Ready now | Not ready yet |
|---|---|---|
| Monorepo foundation | pnpm workspace + Turbo + shared config packages | final package naming and ownership docs need cleanup |
| Desktop backend shell | Tauri scaffold exists | domain commands, schema, and security controls not implemented |
| Desktop UI shell | Next app scaffold exists | analyst workflows and command adapters not implemented |
| Web surface | Next app scaffold exists | no web-specific product capabilities defined |
| Shared packages | config packages and `@repo/ui` scaffold exist | domain contracts in `packages/types` not implemented |
| Documentation | architecture, migration, and v1 reference now exist | docs must stay synchronized as code lands |
| Quality system | lint/type tasks exist for some packages | full CI gates and deterministic release pipeline not implemented |

## Current blockers

### Product blockers

- v1 business logic has not yet been implemented in v2 code.
- v2 command/API contracts are not yet enforced in code.
- No workflow parity evidence exists yet for core domains.

### Technical blockers

- `apps/desktop-backend` is scaffold-level and missing real command modules.
- `apps/desktop` is scaffold-level and missing desktop workflow modules.
- cross-app contract layer (`packages/types`) is not implemented.
- release pipeline and quality gates are not codified in CI.

### Security blockers

- command-risk controls are defined in docs but not implemented.
- permission/capability hardening is not yet verified in code.
- destructive operation safeguards and auditing need implementation.

### Performance blockers

- baseline metrics are not yet captured as enforceable CI/perf checks.
- no regression harness is present for ingest/search/render budgets.

## What can be done immediately

- implement domain contract layer in `packages/types`
- implement backend domain command modules in `apps/desktop-backend`
- implement desktop command adapters + workflows in `apps/desktop`
- wire CI checks for lint/types/tests/build before feature work scales

## What should wait

- major `apps/web` feature expansion (until desktop core is stable)
- monetization features (until core workflow quality gates pass)

## Readiness gates before implementation complete

1. Domain contract gate: typed contracts defined and adopted.
2. Command gate: core command matrix rows implemented and tested.
3. Security gate: command-risk checklist enforced.
4. Performance gate: agreed p95/p99 budgets pass.
5. Reliability gate: migration/release rollback pathways validated.
6. Documentation gate: architecture/readiness/migration docs updated with actual implementation state.

## Recommended next execution order

1. Implement core domain contracts and backend command skeletons.
2. Implement desktop command adapters and workflow shells.
3. Port/rebuild high-value workflows first (cases, ingestion, search, notes).
4. Add tests and CI gates in parallel with each domain.
5. Iterate through remaining domains (findings, timeline, duplicates, time/billing).
6. Expand web surface only after desktop core gates pass.
