# CaseSpace v2 Readiness

Tracks implemented scope, validated scope, and gates required before production sign-off and AI enablement.

**Last updated:** 2026-05-21

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — see [product-spec-bible.md](product-spec-bible.md) |
| Core Parity **backend** | **Complete (local)** — SQLite, FTS, P0 commands, parity + hardening suites |
| Core Parity **UX** (v1 port) | **In progress** — U1–U3 done; U4–U11 pending — [ui-port-plan.md](ui-port-plan.md) |
| AINative phase | **Blocked** — until UX Parity Build Gate |
| Remote CI evidence | Partial — push Node 24 + parity suites for fresh CI proof |

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
| Monorepo foundation | pnpm + Turbo + arch guard | Remote CI on Node 24 after next push |
| Desktop backend | Full non-AI command matrix + SQLite/FTS + parity/hardening | AI-native commands; module split (`commands/*`) |
| Desktop UI | Case hub (list, create, delete, theme, primitives) | Workspace layout, viewers, panels, board, time UI, reports UI, search palette |
| Web surface | Marketing + download page | Content polish only |
| Shared packages | `@repo/types` contracts (partial) | Full DTO parity + adapter envelopes |
| Documentation | Spec pack + backend gate evidence | Feature catalog row-by-row as UI lands |
| Quality system | `ops:validate:local`, parity, hardening | UX E2E oracles (see test-oracle-matrix) |
| Toolchain | Node 24 policy + local validate pass | Live release multi-arch proof |

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Implementation Readiness (planning) | **PASS** | [implementation-readiness-gate.md](implementation-readiness-gate.md) |
| Core Parity **backend** Build Gate | **PASS (local)** | C1–C7 below |
| UX Parity Build Gate | **Not started** | [ui-port-plan.md](ui-port-plan.md) U1–U9 |

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

1. Finish **UX port** (Phases U4–U11) on elite architecture
2. Pass **UX Parity Build Gate** + manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md)
3. **AINative** per [spec/ai-capability-matrix.md](spec/ai-capability-matrix.md)
4. Release/prod proof via `pnpm release:validate` when cutting release

## Validation evidence

| Run | Date | Command | Result |
|-----|------|---------|--------|
| Parity integration | 2026-05-21 | `pnpm test:parity` | **pass** |
| Hardening suite | 2026-05-21 | `pnpm test:hardening` | **pass** |
| Local validate stack | 2026-05-21 | `pnpm ops:validate:local` | **pass** |
| Desktop UI lint/types/build | 2026-05-21 | `pnpm --filter desktop lint/check-types/build` | **pass** (post hub port) |

*Update this table after each validation run.*

## Immediate next execution

1. **Phase U4** — Workspace shell: `WorkspaceLayout`, `CaseHeader`, `FileNavigator`; retire legacy `case-workspace.tsx` monolith — [ui-port-plan.md](ui-port-plan.md)
2. Expand `command-client.ts` + hooks as each UI surface wires commands
3. Optional **U3 tail** — `EditCaseDialog`, `LargeFolderWarning`, filters (backend metadata if needed)
4. Keep `pnpm test:parity` + `pnpm test:hardening` on every merge
5. Push for fresh GitHub CI on Node 24

## What should wait

- AINative features
- Team collaboration
- Rich PDF/Office in-app viewers (P1)
- v1 DB import tool (P1)
