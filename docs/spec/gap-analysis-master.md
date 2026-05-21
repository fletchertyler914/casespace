# Master Gap Analysis (v1 -> v2)

## Executive summary

v2 **backend** now matches v1 P0 command + SQLite/FTS outcomes (parity suites pass locally). **Desktop UX** is mid-port: case hub shipped; workspace/viewers/panels pending ([ui-port-plan.md](../ui-port-plan.md)). v1 remains the reference for layout and interaction. Execution order: **backend parity ✅ → UX parity → AINative**.

## Classification totals dashboard

| Classification | Backend (approx) | UI (approx) | Data (approx) | Deps (approx) |
|----------------|------------------|-------------|---------------|---------------|
| portable-as-is | 3 | 4 | 2 | 4 |
| portable-with-redesign | 25 | 12 | 10 | 8 |
| not-portable-replace | 5 | 4 | 2 | 3 |
| missing-in-v2 | 40+ | 14 | 8 | 6 |

*Detailed rows in track-specific docs.*

## Cross-track risk rollup

| Priority | Risk IDs |
|----------|----------|
| P0 blockers | BE-R01, BE-R02, BE-R03, BE-R04, DA-G01, DE-R01, DE-R02 |
| P1 high | BE-R05, BE-R07, UI-006 viewer, DE-R03 |
| P2 defer | AI features, symphonia, updater |

## Launch critical path

1. Author and lock spec pack ✅
2. Node 24 toolchain policy ✅
3. SQLite + migrations + core schema ✅
4. Ingest + load case files (persisted) ✅
5. Case hub UI ✅ — workspace UI **in progress** ([ui-port-plan.md](../ui-port-plan.md))
6. Artifacts CRUD + FTS search (backend ✅; UI panels pending)
7. Review status + report exports + timer/billing (backend ✅; UI pending)
8. UX Parity Build Gate → then AINative

## Deferred backlog with rationale

| Item | Rationale |
|------|-----------|
| All AI features | Parity-first sequencing |
| Team/collab | Solo launch wedge |
| In-app PDF/Office P0 | Launch-safe baseline; external open OK |
| v1 DB import | P1 after schema stable |
| Updater | Needs signing + release proof |

## Final go/no-go recommendation

**Planning go:** Spec bible, gap analysis, and mapping artifacts complete → proceed to **Implementation Readiness Gate** checklist.

**Implementation go:** After gate passes → start persistence + P0 port (see [implementation-readiness-gate.md](../implementation-readiness-gate.md)).

**AI go:** Only after **UX Parity Build Gate** passes (backend gate already passed locally).

## Track documents

- [gap-analysis-backend.md](gap-analysis-backend.md)
- [gap-analysis-ui-workflows.md](gap-analysis-ui-workflows.md)
- [gap-analysis-data-schema.md](gap-analysis-data-schema.md)
- [gap-analysis-dependencies.md](gap-analysis-dependencies.md)
