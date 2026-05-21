# CaseSpace v2 Readiness

Tracks implemented scope, validated scope, and gates required before production sign-off and AI enablement.

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — see [product-spec-bible.md](product-spec-bible.md) |
| Implementation (CoreParity) | **Complete** — full non-AI parity command matrix implemented and validated |
| AINative phase | **Ready to start** — Core Parity Build Gate passed locally |
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
| Desktop backend | Full non-AI command matrix + SQLite/FTS + parity suite | AI-native commands only |
| Desktop UI | Case hub + workspace routes, text/image preview, artifacts, search, timer, reports | PDF/Office in-app preview (P1) |
| Web surface | Marketing + download page | Content polish only |
| Shared packages | `@repo/types` contracts (partial) | Full DTO parity + adapter envelopes |
| Documentation | Spec bible + gap analysis complete | Update as implementation lands |
| Quality system | Local lint/type/build + parity + hardening suites | Remote CI evidence on latest push |
| Toolchain | Node 24 policy + local validate pass | CI on Node 24 after next push |

## Implementation Readiness Gate

Planning gate: **PASS** (see [implementation-readiness-gate.md](implementation-readiness-gate.md)).

## Core Parity Build Gate (passed)

| # | Criterion | Status |
|---|-----------|--------|
| C1 | P0 non-AI E2E workflows | **validated** (`pnpm test:parity` + `pnpm test:hardening`) |
| C2 | P0 commands per ledger | **validated** (all non-AI commands implemented) |
| C3 | SQLite replaces JSON store | **validated** |
| C4 | FTS search | **validated** |
| C5 | Report + billing exports | **validated** (5 export types) |
| C6 | No critical P0 defects | none known in parity suite |

## Execution order (locked)

1. CoreParity port on elite architecture
2. E2E validation + bug burn-down
3. AINative features (post-gate)

## Validation evidence

| Run | Date | Node | Command | Result |
|-----|------|------|---------|--------|
| Parity integration | 2026-05-21 | — | `pnpm test:parity` | **pass** (12 tests: path/security, ingest, FTS, artifacts, timer, reports, config, duplicate metadata) |
| Hardening suite | 2026-05-21 | — | `pnpm test:hardening` | **pass** (golden seed manifest, malformed-store fail-closed, path escape rejection, 10k ingest stress) |
| Local validate stack | 2026-05-21 | v24.14.0+ | `pnpm ops:validate:local` | **pass** (includes parity + hardening + build + release contract) |
| GitHub CI main | 2026-05-21 | 24 (pending push) | CI workflow | last known success on main (pre–Node 24 bump) |

*Update this table after each validation run.*

## Immediate next execution

1. Start AINative implementation phase per `docs/spec/ai-capability-matrix.md`
2. Keep parity + hardening regression suites (`pnpm test:parity`, `pnpm test:hardening`) as required gates
3. Add remote CI evidence for Node 24 + parity/hardening suites

## What should wait

- Team collaboration features
- Rich PDF/Office in-app viewers (P1)
