# CaseSpace Readiness

Tracks implemented scope, validated scope, and gates before production sign-off and AI enablement.

**Last updated:** 2026-05-23

## Executive status

| Area | Status |
|------|--------|
| Planning / spec pack | **Complete** — [product-spec-bible.md](product-spec-bible.md) |
| Core backend | **Complete (local)** — SQLite, FTS, P0 commands, parity + hardening |
| Desktop UX | **Implemented (local)** — case hub, workspace, viewers, board, artifacts, reports, billing, evidence-to-report pipeline. **Not release-validated** until native E2E checklist passes |
| Toolchain | Next **16.2.6** catalog-pinned |
| AI-native phase | **Partially implemented locally** — extract -> analyze -> approve -> AI report draft pipeline with BYOK provider settings; broader AI-native GA remains blocked until UX release gate |
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
| Parity | 2026-05-22 | `pnpm test:parity` | pass (16 parity + 4 hardening incl. text extract + AI draft lifecycle) |
| Local validate | 2026-05-22 | `pnpm ops:validate:local` | pass (0.1.11) |
| Desktop unit | 2026-05-22 | `pnpm test:desktop` | pass (173 tests) |
| Desktop E2E (mocked) | 2026-05-22 | `pnpm test:e2e` | pass (13 tests incl. analyze-case smoke) |
| Agents tests | 2026-05-22 | `pnpm --filter @repo/agents test` | pass (3 tests) |
| Evidence pipeline backend | 2026-05-22 | `cargo check` | pass (schema v8, extract, analyze, drafts) |
| v0.1.11 bundle | 2026-05-22 | `pnpm ops:validate:local` | pass (`CaseSpace_0.1.11_aarch64.dmg`, ad-hoc signed) |
| AI report follow-up build | 2026-05-22 | `pnpm build` | pass (`CaseSpace_0.1.10_aarch64.dmg`) |
| v0.1.9 bundle | 2026-05-22 | `pnpm build` | `CaseSpace_0.1.9_aarch64.dmg` (ad-hoc signed) |
| PMF gate (Wave B) | — | [spec/pmf-gate-eval.md](spec/pmf-gate-eval.md) | **NOT EARNED** — 30 days post Wave A |

## Next execution

1. **UX release gate** — `pnpm dev` + [native-e2e-checklist.md](spec/native-e2e-checklist.md)
2. **Report export depth** (PDF/DOCX) — optional before AI phase
3. **Production signing / updater** — `pnpm release:validate`
4. **AI-native** — after UX gate per [architecture-agents.md](architecture-agents.md)

## AI Provider Readiness

CaseSpace uses bring-your-own-key AI access for distribution. Users configure an OpenAI-compatible API key in Settings -> AI provider; the key is stored in the OS keychain, and model/base URL are stored as non-secret local app settings. Developer env vars (`OPENAI_API_KEY`, `CASESPACE_OPENAI_API_KEY`, `CASESPACE_OPENAI_MODEL`, `CASESPACE_OPENAI_API_URL`) remain local-dev/CI fallbacks and must not be treated as bundled production credentials.

The same BYOK provider powers image OCR via the chat-completions `image_url` content type (`ai_provider::vision_ocr`). All local-evidence flows — ingest, dedup, FTS5 search, deterministic report assembly, time tracking, digital-PDF/DOCX/XLSX/CSV/TXT extraction — run without a key. Scanned PDFs without a text layer return an actionable "convert pages to images" status pending Phase 2 PDF rasterization (see [product-roadmap.md](product-roadmap.md) §Deferred). The legacy Tesseract dependency has been removed; no system-binary install is required on any platform.

## Deferred (post–release gate)

- Team collaboration
- Legacy database import utility
- Native UI automation in CI (macOS)

Keep `pnpm test:parity` and `pnpm test:hardening` on every backend merge. Keep `pnpm ops:validate:local` before merging desktop changes.
