# CaseSpace v2 Readiness

Tracks implemented scope, validated scope, and gates required before production sign-off and AI enablement.

**Last updated:** 2026-05-21

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — [product-spec-bible.md](product-spec-bible.md) |
| Core Parity **backend** | **Complete (local)** — SQLite, FTS, P0 commands, parity + hardening suites |
| Core Parity **UX** (v1 port) | **In progress** — U1–U6 done/MVP; U7/U8/U10 started; U9/U11 next — [ui-port-plan.md](ui-port-plan.md) |
| Toolchain | Next **16.2.6** catalog-pinned; `minimumReleaseAge` 48h |
| AINative phase | **Blocked** — until UX Parity Build Gate |
| Remote CI evidence | Partial — push for fresh CI on Node 24 |

## Documentation map (source of truth)

| Document | Purpose |
|----------|---------|
| [product-spec-bible.md](product-spec-bible.md) | Requirements and phase partitioning |
| [ui-port-plan.md](ui-port-plan.md) | **Active** — UI port phases U1–U11 and UX gate |
| [implementation-readiness-gate.md](implementation-readiness-gate.md) | Planning / backend / UX / AI gates |
| [command-parity-ledger.md](command-parity-ledger.md) | v1 ↔ v2 commands (backend) |
| [desktop-workflow-mapping.md](desktop-workflow-mapping.md) | v1 UI → v2 component map |
| [persistence-mapping.md](persistence-mapping.md) | SQLite target schema |
| [spec/gap-analysis-master.md](spec/gap-analysis-master.md) | Executive gap summary |

## Readiness matrix

| Area | Ready now | Not ready yet |
|------|-----------|---------------|
| Monorepo foundation | pnpm + Turbo + arch guard; catalog-pinned Next | Remote CI green on Node 24 after next push |
| Desktop backend | Full non-AI command matrix + SQLite/FTS + ingest v2 | AI-native commands; `commands/*` module split |
| Desktop UI | Hub, workspace shell, file navigator, in-app viewers, artifact panel MVP, cmdk search, duplicates panel MVP, timer widget MVP | Board/dnd parity, duplicate merge UX, time pages/dialogs, reports UI, settings parity |
| Web surface | Marketing + download page | Content polish only |
| Shared packages | `@repo/types` contracts (partial) | Full DTO parity + adapter envelopes |
| Documentation | Spec pack + port plan synced to code | Feature catalog row-by-row as U7–U10 land |
| Quality system | `ops:validate:local`, parity, hardening | UX E2E oracles ([test-oracle-matrix](spec/test-oracle-matrix.md)) |
| Toolchain | Node 24, Next 16.2.6 pin, lockfile + frozen CI install | Live release multi-arch proof |

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Implementation Readiness (planning) | **PASS** | [implementation-readiness-gate.md](implementation-readiness-gate.md) |
| Core Parity **backend** Build Gate | **PASS (local)** | C1–C7 below |
| UX Parity Build Gate | **In progress** | G1–G4 done; G5/G6/G8 partial; G7 pending — [ui-port-plan.md](ui-port-plan.md) |

### Core Parity backend (passed)

| # | Criterion | Status |
|---|-----------|--------|
| C1 | P0 non-AI workflows (backend/integration) | **validated** — `pnpm test:parity`, `pnpm test:hardening` |
| C2 | P0 commands per ledger | **validated** |
| C3 | SQLite replaces JSON store | **validated** |
| C4 | FTS search | **validated** |
| C5 | Report + billing exports (commands) | **validated** |
| C6 | No critical P0 defects in parity suite | **validated** |
| C7 | Evidence in this doc | **validated** |

## Execution order (locked)

1. Finish **UX port** U7–U11 on elite architecture
2. Pass **UX Parity Build Gate** + manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md)
3. **AINative** per [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md)
4. Release/prod proof via `pnpm release:validate` when cutting release

## Validation evidence

| Run | Date | Command | Result |
|-----|------|---------|--------|
| Parity integration | 2026-05-21 | `pnpm test:parity` | **pass** |
| Hardening suite | 2026-05-21 | `pnpm test:hardening` | **pass** |
| Local validate stack | 2026-05-21 | `pnpm ops:validate:local` | **pass** (when last run) |
| Desktop UI lint/types/build | 2026-05-21 | `pnpm --filter desktop lint/check-types/build` | **pass** |

*Update this table after each validation run.*

## Immediate next execution

1. **Phase U7 continuation** — board/dnd + duplicate merge decisions — [ui-port-plan.md](ui-port-plan.md)
2. **Phase U8 continuation** — time page + segment/billing dialogs
3. **Phase U9** — reports UI
4. **Phase U10 continuation** — settings + richer result actions
5. **Phase U11** — remove `components/case-workspace.tsx`; UX gate smoke + `ops:validate:local`
5. Optional **U3 tail** — edit case, large-folder warning, filters
6. Keep `pnpm test:parity` + `pnpm test:hardening` on every merge
7. Bump Next via `pnpm-workspace.yaml` catalog only (review lockfile diff)

## What should wait

- AINative features
- Team collaboration
- v1 DB import tool (P1)
- Mapping/settings sprawl beyond P0 (P1)
