# CaseSpace Readiness

Tracks implemented scope, validated scope, and gates before production sign-off and AI enablement.

**Last updated:** 2026-05-22

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — [product-spec-bible.md](product-spec-bible.md) |
| Core backend | **Complete (local)** — SQLite, FTS, P0 commands, parity + hardening |
| Desktop UX | **Implemented (local)** — case hub, workspace, viewers, board, artifacts, reports, billing. **Not release-validated** until native E2E checklist passes |
| Toolchain | Next **16.2.6** catalog-pinned |
| AI-native phase | **Blocked** until UX release gate |
| Production distribution | **Blocked** — updater placeholders; code signing / notarization pending |

## Gates

| Gate | Status |
|------|--------|
| Implementation readiness (planning) | **PASS** |
| Core backend build gate | **PASS (local)** — `pnpm test:parity`, `pnpm test:hardening` |
| UX release gate | **NOT EARNED** — run [spec/native-e2e-checklist.md](spec/native-e2e-checklist.md) in `pnpm dev` |
| Production distribution gate | **NOT EARNED** |

## Validation evidence

| Run | Date | Command | Result |
|-----|------|---------|--------|
| Parity | 2026-05-22 | `pnpm test:parity` | pass (12 parity + 4 hardening incl. Wave A templates) |
| Local validate | 2026-05-22 | `pnpm ops:validate:local` | pass (0.1.9) |
| Desktop unit | 2026-05-22 | `pnpm test:desktop` | pass (166 tests) |
| Desktop E2E (mocked) | 2026-05-22 | `pnpm test:e2e` | pass (12 tests) |
| Agents tests | 2026-05-22 | `pnpm --filter @repo/agents test` | pass (3 tests) |
| v0.1.9 bundle | 2026-05-22 | `pnpm build` | `CaseSpace_0.1.9_aarch64.dmg` (ad-hoc signed) |
| PMF gate (Wave B) | — | [spec/pmf-gate-eval.md](spec/pmf-gate-eval.md) | **NOT EARNED** — 30 days post Wave A |

## Next execution

1. **UX release gate** — `pnpm dev` + [native-e2e-checklist.md](spec/native-e2e-checklist.md)
2. **Report export depth** (PDF/DOCX) — optional before AI phase
3. **Production signing / updater** — `pnpm release:validate`
4. **AI-native** — after UX gate per [architecture-agents.md](architecture-agents.md)

## Deferred (post–release gate)

- Team collaboration
- Legacy database import utility
- Native UI automation in CI (macOS)

Keep `pnpm test:parity` and `pnpm test:hardening` on every backend merge. Keep `pnpm ops:validate:local` before merging desktop changes.
