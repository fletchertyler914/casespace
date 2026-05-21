# CaseSpace v2 Readiness

Tracks implemented scope, validated scope, and gates required before production sign-off and AI enablement.

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — see [product-spec-bible.md](product-spec-bible.md) |
| Implementation (CoreParity) | **Not started** — porting gated on checklist below |
| AINative phase | **Blocked** — until Core Parity Build Gate passes |
| Remote CI evidence | Partial — latest main CI green; full release proof ongoing |

## Documentation map (source of truth)

| Document | Purpose |
|----------|---------|
| [product-spec-bible.md](product-spec-bible.md) | Requirements and phase partitioning |
| [implementation-readiness-gate.md](implementation-readiness-gate.md) | Planning vs porting vs AI gates |
| [command-parity-ledger.md](command-parity-ledger.md) | v1 ↔ v2 commands |
| [persistence-mapping.md](persistence-mapping.md) | SQLite target schema |
| [desktop-workflow-mapping.md](desktop-workflow-mapping.md) | UI port map |
| [spec/gap-analysis-master.md](spec/gap-analysis-master.md) | Executive gap summary |

## Readiness matrix

| Area | Ready now | Not ready yet |
|------|-----------|---------------|
| Monorepo foundation | pnpm + Turbo + arch guard | CoreParity feature port |
| Desktop backend | Command scaffold + path checks | SQLite, ingest, FTS, full command matrix |
| Desktop UI | Demo workspace slice | Case hub, navigator, viewer, panels |
| Web surface | Marketing + download page | Content polish only |
| Shared packages | `@repo/types` contracts (partial) | Full DTO parity + adapter envelopes |
| Documentation | Spec bible + gap analysis complete | Update as implementation lands |
| Quality system | Local lint/type/build scripts | E2E parity suite, perf harness |
| Toolchain | Node 24 policy + local validate pass | CI on Node 24 after next push |

## Implementation Readiness Gate

Planning gate: **PASS** (see [implementation-readiness-gate.md](implementation-readiness-gate.md)).

## Core Parity Build Gate (blocking AI)

| # | Criterion | Status |
|---|-----------|--------|
| C1 | P0 non-AI E2E workflows | not started |
| C2 | P0 commands per ledger | not started |
| C3 | SQLite replaces JSON store | not started |
| C4 | FTS search | not started |
| C5 | Report + billing exports | not started |
| C6 | No critical P0 defects | not started |

## Execution order (locked)

1. CoreParity port on elite architecture
2. E2E validation + bug burn-down
3. AINative features (post-gate)

## Validation evidence

| Run | Date | Node | Command | Result |
|-----|------|------|---------|--------|
| Local ops validate | 2026-05-20 | v24.15.0 | `pnpm ops:validate:local` | **pass** (arch, lint, types, build, release contract) |
| GitHub CI main | 2026-05-21 | 24 (pending push) | CI workflow | last known success on main (pre–Node 24 bump) |

*Update this table after each validation run.*

## Immediate next execution

1. Begin SQLite persistence foundation (`database.rs` + migrations)
2. Port P0 ingest + case load commands
3. Build case hub + workspace UI shell
4. Expand command-client + services for P0 commands
5. Add integration/E2E tests per [spec/test-oracle-matrix.md](spec/test-oracle-matrix.md)

## What should wait

- All AI-native features ([spec/ai-capability-matrix.md](spec/ai-capability-matrix.md))
- Team collaboration features
- Rich PDF/Office in-app viewers (P1)
