# CaseSpace v2 Readiness

This document tracks implemented scope, validated scope, and remaining gates required before production sign-off.

## Executive status

- Implemented: phase scaffolding for pipeline/contracts/core workflows
- Validated: local lint/type/build checks
- Remaining for production sign-off: full command parity, production persistence model, and live remote CI/release evidence

## Readiness matrix (implemented vs remaining)

| Area                | Ready now                                                    | Not ready yet                                              |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Monorepo foundation | pnpm workspace + Turbo + architecture guard                  | full phase-gate evidence wiring still ongoing              |
| Desktop backend     | Tauri command scaffolding + local tests + path controls      | production-grade persistence and full domain parity remain |
| Desktop UI          | Next workflow scaffolding + typed command adapters           | complete v1 workflow parity and E2E depth remain           |
| Web surface         | Marketing/docs/download routes + release-aware download page | final content and release-proof UX validation remain       |
| Shared packages     | `@repo/types` contracts package added                        | full DTO/versioning expansion remains                      |
| Documentation       | architecture/migration/readiness/runbooks present            | continuous sync required as implementation evolves         |
| Quality system      | lint/type/build local validation + CI workflows defined      | remote workflow pass evidence not yet completed            |

## Current blockers

### Product blockers

- full v1 domain parity is not complete
- command/API matrix coverage is not complete across all domains
- parity evidence across all core workflows is not complete

### Technical blockers

- backend needs production persistence/migration model beyond JSON-store scaffolding
- desktop needs broader workflow coverage and deeper integration tests
- security/performance/offline suites need full automation depth
- release workflows must be proven through live GitHub runs and artifact publication

### Security blockers

- command-risk controls are baseline-only; full coverage remains
- permission/capability hardening requires full review evidence
- destructive-operation safeguards and audit pathways require expansion

### Performance blockers

- baseline metrics are not yet captured as enforceable CI/perf checks.
- no regression harness is present for ingest/search/render budgets.

## Immediate next execution

- expand backend domain modules from scaffold to production-grade implementations
- complete command/API matrix coverage and tests
- run and document live GitHub CI/release/prod-promotion evidence
- deepen offline/performance/security validation automation

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
