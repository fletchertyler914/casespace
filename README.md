# CaseSpace

CaseSpace is a desktop-first investigative case workspace for CFE and fraud examination practitioners. The product ships as a **3-app monorepo**: native engine, desktop UX, and marketing/download web surface.

**Current release line:** `0.1.11` local (evidence-to-report pipeline — extract, AI analysis, draft approval; see [GitHub Releases](https://github.com/fletchertyler914/casespace/releases))  
**Status:** Core backend and desktop UX are **implemented locally**; production release validation and native E2E sign-off are the remaining gates before calling the product **release-validated**. Details: [`docs/readiness.md`](docs/readiness.md), [`docs/product-roadmap.md`](docs/product-roadmap.md).

## Repository layout

| Path | Role |
|------|------|
| `apps/desktop-backend` | Tauri / Rust — commands, SQLite, ingest, search |
| `apps/desktop` | Next.js desktop UX (Tauri shell) |
| `apps/web` | Marketing, docs, `/download` |
| `packages/*` | Shared types, UI, agents |

## License

**BUSL-1.1** — public source; commercial use requires [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md). Converts to **Apache 2.0** on **2029-05-21**.

## Documentation

- [docs/product-spec-bible.md](docs/product-spec-bible.md) — requirements and phases
- [docs/architecture.md](docs/architecture.md) — runtime architecture
- [docs/readiness.md](docs/readiness.md) — gates and validation evidence
- [docs/product-roadmap.md](docs/product-roadmap.md) — UX milestones and checklist
- [docs/desktop-workflow-mapping.md](docs/desktop-workflow-mapping.md) — component map
- [docs/command-catalog.md](docs/command-catalog.md) — native command matrix
- [docs/spec/](docs/spec/) — flows, features, gap analysis, E2E checklist
- [docs/release-runbook.md](docs/release-runbook.md) — release process

## Quickstart

**Prerequisites:** Node.js **24+**, pnpm **10.19** (`.nvmrc`)

```bash
corepack enable
pnpm install
pnpm dev          # Tauri + Next on :3000 (canonical)
pnpm dev:ui       # Next only — no native APIs
pnpm dev:web      # marketing :3001
```

```bash
pnpm ops:validate:local   # lint, types, tests, build, parity
```

AI features use a bring-your-own-key provider model. In the desktop app, open Settings -> AI provider and add an OpenAI-compatible API key; CaseSpace stores the secret in the OS keychain and keeps model/base URL in local app settings. Developers can still set `OPENAI_API_KEY` or `CASESPACE_OPENAI_API_KEY` in `.env` for local `pnpm dev`; optional env overrides include `CASESPACE_OPENAI_MODEL` / `OPENAI_MODEL` and `CASESPACE_OPENAI_API_URL`.

**Local-by-default, AI-on-demand.** Everything CaseSpace does with on-disk evidence — ingest, indexing, dedup, FTS5 search, timeline, notes, time tracking, deterministic report assembly — runs locally with no key. AI analysis, AI report drafting, and image OCR (jpg / png / tiff / webp / heic) go through your BYOK provider via OpenAI-compatible chat completions; no key, no network. Digital PDFs and DOCX/XLSX/CSV/TXT extract locally; scanned PDFs without a text layer surface a clear "convert pages to images and re-ingest" message (full scanned-PDF rasterization is a Phase 2 roadmap item).

Optional env overrides for the analysis pipeline: `CASESPACE_ANALYSIS_MODEL`, `CASESPACE_ANALYSIS_MAX_CHARS` (default 60k), `CASESPACE_ANALYSIS_TOKEN_CEILING` (default 1M).

Next.js is catalog-pinned in `pnpm-workspace.yaml` (**16.2.6**). Do not float framework versions in app `package.json`.

## URLs

- Web: `https://casespace.vercel.app`
- Download: `https://casespace.vercel.app/download`

## Branding

Regenerate icons from `apps/web/public/casespace-owl.png`:

```bash
node scripts/generate-brand-icons.mjs
```
