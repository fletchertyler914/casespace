# Implementation Readiness Gate

Checklists for planning, backend port, UX port, and AI enablement.

## Implementation Readiness Gate (planning)

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
| 3.2 | AI deferred until UX parity gate | complete | [spec/out-of-scope.md](spec/out-of-scope.md) |
| 4.1 | PII policy documented | complete | [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md) |
| 4.2 | Out-of-scope list approved | complete | [spec/out-of-scope.md](spec/out-of-scope.md) |
| 5.1 | Node 24 policy applied | complete | package.json, workflows, `.nvmrc` |
| 5.2 | Validation commands documented | complete | README, [readiness.md](readiness.md) |
| 6.1 | Traceability matrix complete | complete | [spec/traceability-matrix.md](spec/traceability-matrix.md) |
| 6.2 | Test oracles for P0 flows | complete | [spec/test-oracle-matrix.md](spec/test-oracle-matrix.md) |

**Gate status:** **PASS** — planning and toolchain.

## Core Parity backend Build Gate

Backend parity is complete only when **all** are true:

| # | Criterion | Status |
|---|-----------|--------|
| C1 | P0 non-AI workflows pass integration suites | **complete** — `pnpm test:parity`, `pnpm test:hardening` |
| C2 | Backend P0 commands per [command-parity-ledger.md](command-parity-ledger.md) | **complete** |
| C3 | SQLite persistence replaces JSON store | **complete** |
| C4 | FTS search live | **complete** |
| C5 | Five report exports + billing package (commands) | **complete** |
| C6 | No critical/high defects in parity paths | **complete** |
| C7 | Evidence in [readiness.md](readiness.md) | **complete** |

**Status: PASS (local).** Does not include full v1 UX.

## UX Parity Build Gate

Product UX matches v1 P0 outcomes. Criteria G1–G12 in [ui-port-plan.md](ui-port-plan.md).

| Progress | Items |
|----------|-------|
| **Done** | G1 hub, G2 workspace+panels MVP, G3 ingest/sync, G4 in-app viewers, G9 theme/splash, G10 adapters |
| **Partial** | G5 search (cmdk MVP), G6 time (timer widget MVP), G7 reports (panel MVP), G8 duplicates (panel MVP + primary select) |
| **Pending** | G11 dev smoke, G12 ongoing backend regression |

**Status: in progress** (not passed).

AINative is blocked until this gate passes.

## Implementation kickoff order (current)

1. ~~Node 24 policy~~
2. ~~Persistence + FTS + P0 backend commands~~
3. ~~UX U1–U6 (foundation → workspace → viewers → panel MVP)~~
4. **UX U7–U11** — board/duplicates, time, reports, search, gate + cleanup
5. UX Parity Build Gate + manual E2E
6. AINative per [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md)

## Go/no-go

| Decision | Recommendation |
|----------|----------------|
| Continue UX port? | **GO** — U7–U11 |
| Start AINative? | **NO** — until UX Parity Build Gate |
| Cut prod release claiming full product parity? | **NO** — until UX gate + `release:validate` |

Last updated: 2026-05-21.
