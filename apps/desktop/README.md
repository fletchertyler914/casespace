# CaseSpace Desktop UX (`apps/desktop`)

Next.js desktop UX shell for CaseSpace v2.

**Status (2026-05-22, v0.1.8):** V1 parity closure **implemented (local)** — inventory table, viewer actions, structured search, Tiptap artifacts, duplicates depth, **day-based time management (list + calendar)**, reports workspace, column/mapping UI, settings dialogs, **agent panel stub (inert UI)**. **UX Parity Build Gate:** not yet manually validated. **Next:** manual E2E, agent C1 (MCP bridge), production signing. Evidence: [`docs/ui-port-plan.md`](../../docs/ui-port-plan.md), [`docs/readiness.md`](../../docs/readiness.md).

## Role in v2 architecture

- Analyst-facing desktop workflows
- UI state and composition only
- Native I/O via `apps/desktop-backend` through `lib/command-client.ts` (no `invoke()` in components)

## Key directories

| Path | Purpose |
|------|---------|
| `app/` | Routes: `/` hub, `/case` workspace |
| `components/case/` | Case list, cards, create/edit/delete dialogs |
| `components/workspace/` | Shell, navigator, file table, header, split/board |
| `components/viewer/` | File preview router + PDF/DOCX/XLSX/code/image/video/audio |
| `components/artifacts/` | Notes, findings, timeline, duplicates, reports |
| `components/mapping/` | Field mapper stepper |
| `components/billing/` | Timer, time panel, billing dialogs |
| `lib/command-client.ts` | Typed Tauri command adapters |
| `lib/file-preview.ts` | Preview kind detection |
| `public/pdf.worker.min.js` | PDF.js worker for in-app PDF viewer |

## Local development

**Full desktop (recommended):** from repo root:

```bash
pnpm dev
```

**UI only (no native APIs):**

```bash
pnpm dev:ui
```

## Validation

```bash
pnpm --filter desktop lint
pnpm --filter desktop check-types
pnpm test:desktop          # Vitest: unit + component (146 tests)
pnpm test:e2e              # Playwright: mocked Tauri (11 tests, port 3099)
pnpm test:e2e              # Playwright: browser E2E with mocked Tauri invoke
pnpm ops:validate:local    # from repo root (includes parity + desktop tests + e2e)
```

E2E runs `next dev` with `window.__CASESPACE_MOCK_INVOKE__` — not the full Tauri shell. Use `pnpm dev` for native smoke.
