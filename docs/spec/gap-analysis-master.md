# Master Gap Analysis (v1 -> v2)

## Executive summary

v2 is a **thin scaffold** (~20 backend commands, JSON store, single demo UI). v1 is a **full solo-investigator product** (~77 commands, SQLite+FTS, rich workspace). Domain outcomes are portable; **implementation must be redesigned**. Execution order: **CoreParity first, AINative second**.

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

1. Author and lock spec pack (this planning phase) ✅
2. Node 24 toolchain policy
3. SQLite + migrations + core schema
4. Ingest + load case files (persisted)
5. Workspace UI shell (case hub → navigator → viewer)
6. Artifacts CRUD + FTS search
7. Review status + report exports + timer/billing core
8. E2E validation → **Core Parity Build Gate**
9. AINative phase

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

**AI go:** Only after Core Parity Build Gate passes.

## Track documents

- [gap-analysis-backend.md](gap-analysis-backend.md)
- [gap-analysis-ui-workflows.md](gap-analysis-ui-workflows.md)
- [gap-analysis-data-schema.md](gap-analysis-data-schema.md)
- [gap-analysis-dependencies.md](gap-analysis-dependencies.md)
