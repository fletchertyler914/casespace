# CaseSpace v2 Readiness

Tracks implemented scope, validated scope, and gates required before production sign-off and AI enablement.

**Last updated:** 2026-05-21 (V1 parity closure implementation landed; UX gate not yet manually validated — see [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md))

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — [product-spec-bible.md](product-spec-bible.md) |
| Core Parity **backend** | **Complete (local)** — SQLite, FTS, P0 commands, parity + hardening suites |
| Core Parity **UX** (v1 port) | **Implemented (local), not gate-validated** — inventory table, viewer actions, structured search, Tiptap artifacts, duplicates depth, time/billing, reports workspace, mapping UI, settings dialogs. Remaining: board multi-select/filters, PDF/DOCX reports, manual E2E. See [spec/gap-analysis-ui-workflows.md](spec/gap-analysis-ui-workflows.md) |
| Toolchain | Next **16.2.6** catalog-pinned; `minimumReleaseAge` 48h |
| AINative phase | **Blocked** until UX gate; stack ADR: [architecture-agents.md](architecture-agents.md) |
| Production distribution | **Blocked** — updater plugin wired with placeholder pubkey/endpoints; no Developer ID / Windows signing / notarization. macOS ad-hoc signing only |
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
| Desktop UI | V1 parity closure: inventory table, viewer actions, Tiptap artifacts, duplicates depth, time/billing, reports workspace, mapping UI, settings, structured search | Board multi-select/filters; PDF/DOCX reports; **UX gate** manual E2E ([native-e2e-checklist](spec/native-e2e-checklist.md)) |
| Web surface | Marketing + download page | Content polish only |
| Shared packages | `@repo/types` contracts for P0 commands | Full DTO audit vs Rust payloads |
| Documentation | Spec pack + [v1-parity-closeout](spec/v1-parity-closeout.md) | UX gate sign-off row in readiness |
| Quality system | `ops:validate:local`, parity (16), hardening, desktop (146), e2e (11) | Native Tauri UI automation on macOS (manual checklist) |
| Toolchain | Node 24, Next 16.2.6 pin, lockfile + frozen CI install | Live release multi-arch proof |

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Implementation Readiness (planning) | **PASS** | [implementation-readiness-gate.md](implementation-readiness-gate.md) |
| Core Parity **backend** Build Gate | **PASS (local)** | C1–C7 below |
| UX Parity Build Gate | **NOT EARNED (validated)** — implementation landed 2026-05-21; requires manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md) + board depth review before pass |
| Production distribution Gate | **NOT EARNED** — placeholder updater only; Developer ID + Windows signing + notarization missing |

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
3. **AINative** per [architecture-agents.md](architecture-agents.md) + [ai-capability-matrix.md](spec/ai-capability-matrix.md)
4. Release/prod proof via `pnpm release:validate` when cutting release

## Validation evidence

| Run | Date | Command | Result |
|-----|------|---------|--------|
| Parity integration | 2026-05-21 | `pnpm test:parity` | **pass** (16 flows: parity + command-path) |
| Hardening suite | 2026-05-21 | `pnpm test:hardening` | **pass** |
| Local validate stack | 2026-05-21 | `pnpm ops:validate:local` | **pass** (v0.1.7 pre-release) |
| Parity (search + merge) | 2026-05-21 | `pnpm test:parity` (flows 8–9) | **pass** |
| Desktop unit + component | 2026-05-21 | `pnpm test:desktop` | **pass** (146 tests) |
| Desktop UI E2E (mocked) | 2026-05-21 | `pnpm test:e2e` | **pass** (11 tests, port 3099) |
| Desktop UI lint/types/build | 2026-05-21 | `pnpm --filter desktop lint/check-types/build` | **pass** |

*Update this table after each validation run.*

## Immediate next execution

See [spec/v1-parity-closeout.md](spec/v1-parity-closeout.md).

1. **UX Parity Build Gate** — `pnpm dev` + [native-e2e-checklist.md](spec/native-e2e-checklist.md)
2. **Board depth** (optional before AINative)
3. **Report PDF/DOCX** (deferred)
4. **AINative** — blocked until UX gate
5. **Production signing / updater** — `pnpm release:validate`
12. **Ingest UX** — progress bar, cancellation, LargeFolderWarningDialog, DuplicateIngestionNotification (2–3 days)
13. **Frontend unit tests** — vitest setup; start with command-client + file-preview + viewer routing (ongoing)
14. **Updater + production signing** — distinct workstream once paid Apple/Windows certs are in place

Keep `pnpm test:parity` + `pnpm test:hardening` on every merge. Bump Next via `pnpm-workspace.yaml` catalog only (review lockfile diff).

## What should wait

- AINative features
- Team collaboration
- v1 DB import tool (P1)
- Mapping/settings sprawl beyond P0 (P1)
