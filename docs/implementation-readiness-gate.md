# Implementation Readiness Gate

Checklist that must pass before **feature-port implementation** begins. Planning artifacts from Elite Migration Realignment must be complete first.

## Implementation Readiness Gate

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1.1 | `docs/product-spec-bible.md` with requirement IDs | complete | [product-spec-bible.md](product-spec-bible.md) |
| 1.2 | All `docs/spec/*` appendices cross-linked | complete | spec/ directory |
| 2.1 | Backend gap analysis | complete | [spec/gap-analysis-backend.md](spec/gap-analysis-backend.md) |
| 2.2 | UI gap analysis | complete | [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md) |
| 2.3 | Data gap analysis | complete | [spec/gap-analysis-data-schema.md](spec/gap-analysis-data-schema.md) |
| 2.4 | Dependency gap analysis | complete | [spec/gap-analysis-dependencies.md](spec/gap-analysis-dependencies.md) |
| 2.5 | Master gap analysis + critical path | complete | [spec/gap-analysis-master.md](spec/gap-analysis-master.md) |
| 3.1 | P0-CoreParity / P1 / AI-Phase tags on features | complete | [spec/feature-catalog.md](spec/feature-catalog.md) |
| 3.2 | AI deferred until parity gate | complete | [spec/out-of-scope.md](spec/out-of-scope.md) |
| 4.1 | PII policy documented | complete | [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md) |
| 4.2 | Out-of-scope list approved | complete | [spec/out-of-scope.md](spec/out-of-scope.md) |
| 5.1 | Node 24 policy applied | complete | package.json, workflows, .nvmrc; local validate 2026-05-20 (Node v24.15.0) |
| 5.2 | Validation commands documented | complete | README, [readiness.md](readiness.md) |
| 6.1 | Traceability matrix complete | complete | [spec/traceability-matrix.md](spec/traceability-matrix.md) |
| 6.2 | Test oracles for P0 flows | complete | [spec/test-oracle-matrix.md](spec/test-oracle-matrix.md) |

**Gate status:** PASS for planning/documentation and toolchain validation (5.1). **Core Parity port** may proceed per kickoff order below.

## Core Parity Build Gate

Core parity is complete only when **all** are true:

| # | Criterion | Status |
|---|-----------|--------|
| C1 | P0 non-AI workflows pass E2E | not started |
| C2 | Backend P0 commands implemented per [command-parity-ledger.md](command-parity-ledger.md) | not started |
| C3 | SQLite persistence replaces JSON store | not started |
| C4 | FTS search live | not started |
| C5 | Five report exports + billing package | not started |
| C6 | No critical/high defects in P0 paths | not started |
| C7 | Evidence recorded in [readiness.md](readiness.md) | not started |

**AI-Native Enablement cannot start until C1–C7 pass.**

## Implementation kickoff order

1. Apply Node 24 policy (toolchain)
2. Build persistence + FTS foundation
3. Port P0 backend commands by domain module
4. Build P0 desktop workspace UI
5. Wire E2E tests + `pnpm ops:validate:local`
6. Validate Core Parity Build Gate
7. Begin AI phase per [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md)

## Go/no-go for porting

| Decision | Recommendation |
|----------|----------------|
| Start CoreParity port? | **GO** — planning gate satisfied |
| Start AINative? | **NO** — blocked until Core Parity gate |

Last updated: planning phase completion.
