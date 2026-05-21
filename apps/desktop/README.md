# CaseSpace Desktop UX (`apps/desktop`)

Next.js desktop UX shell for CaseSpace v2.

**Status (2026-05-21):** U1–U6 shipped — case hub, workspace shell, in-app viewers (PDF/DOCX/XLSX/image/text/CSV), artifact panel MVP. **Next:** U7 board/duplicates, U10 search, U8–U9 time/reports, U11 gate. Plan: [docs/ui-port-plan.md](../../docs/ui-port-plan.md).

## Role in v2 architecture

- Analyst-facing desktop workflows
- UI state and composition only
- Native I/O via `apps/desktop-backend` through `lib/command-client.ts` (no `invoke()` in components)

## Key directories

| Path | Purpose |
|------|---------|
| `app/` | Routes: `/` hub, `/case` workspace |
| `components/case/` | Case list, cards, dialogs |
| `components/workspace/` | Shell, navigator, header, split/board |
| `components/viewer/` | File preview router + PDF/Office/text previews |
| `components/artifacts/` | Notes, findings, timeline panels |
| `lib/command-client.ts` | Typed Tauri command adapters |
| `lib/file-preview.ts` | Preview kind detection |
| `public/pdf.worker.min.js` | PDF.js worker for in-app PDF viewer |

## Local development

**Full desktop (recommended):** from repo root:

```bash
pnpm dev
```

**UI-only** (browser at `http://localhost:3000`, no Tauri APIs):

```bash
pnpm dev:ui
```

## Quality checks

```bash
pnpm --filter desktop lint
pnpm --filter desktop check-types
pnpm --filter desktop build
```

## Framework version

Next.js version comes from the workspace catalog (`pnpm-workspace.yaml` → currently **16.2.6**). Apps declare `"next": "catalog:"` — do not add floating `^` ranges.

## References

- [docs/ui-port-plan.md](../../docs/ui-port-plan.md)
- [docs/desktop-workflow-mapping.md](../../docs/desktop-workflow-mapping.md)
- [docs/architecture.md](../../docs/architecture.md)
- [docs/readiness.md](../../docs/readiness.md)
