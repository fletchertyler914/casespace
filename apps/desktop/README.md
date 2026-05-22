# CaseSpace Desktop UX (`apps/desktop`)

Next.js desktop UX shell for CaseSpace v2.

**Status (2026-05-21, v0.1.7):** V1 parity closure **implemented (local)** — inventory table, viewer actions (metadata/rename/delete/file-change), structured search, Tiptap artifacts, duplicates depth, time segments + billing UI, reports workspace, column/mapping UI, settings dialogs. **UX Parity Build Gate:** not yet manually validated. **Next:** board multi-select/filters, manual E2E, AINative (blocked). Evidence: [`docs/ui-port-plan.md`](../../docs/ui-port-plan.md), [`docs/readiness.md`](../../docs/readiness.md).

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
pnpm --filter desktop test
pnpm ops:validate:local   # from repo root
```
