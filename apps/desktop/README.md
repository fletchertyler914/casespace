# CaseSpace Desktop UX (`apps/desktop`)

Next.js desktop UX shell for CaseSpace v2.

**Status (2026-05-21 — post evidence-based source re-audit):** **Shallow MVP** of v1 surface (~30–40% by user-flow). Functional baseline: case CRUD, multi-source ingest/sync with dedup, folder-tree navigator, viewer routing for 15 file categories (extensions match v1 after v0.1.6 PDF fix), plain-text notes/findings/timeline CRUD, status-lane board with DnD, timer widget, markdown report exports, workspace prefs persistence. **Known gaps and bugs:** global search dialog broken at runtime (Rust↔UI shape mismatch); `merge_duplicate_metadata` doesn't relink artifacts; no inventory data grid; no viewer metadata panel / rename / delete / file-change UI; no Tiptap rich-text editors; no column/mapping config UI; no production code-signing or updater. Full evidence table: [`docs/spec/gap-analysis-ui-workflows.md`](../../docs/spec/gap-analysis-ui-workflows.md). Re-prioritized phase plan: [`docs/ui-port-plan.md`](../../docs/ui-port-plan.md).

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
| `components/viewer/` | File preview router + previews: PDF, DOCX, XLSX, image, text/code/markdown, CSV/TSV, video, audio, external fallback |
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
