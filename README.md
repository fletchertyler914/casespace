# CaseSpace

CaseSpace is a desktop-first investigative case workspace for CFE and fraud examination practitioners. The product ships as a **3-app monorepo**: native engine, desktop UX, and marketing/download web surface.

**Current release line:** `0.1.8` (see [GitHub Releases](https://github.com/fletchertyler914/casespace/releases))  
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

Next.js is catalog-pinned in `pnpm-workspace.yaml` (**16.2.6**). Do not float framework versions in app `package.json`.

## URLs

- Web: `https://casespace.vercel.app`
- Download: `https://casespace.vercel.app/download`

## Branding

Regenerate icons from `apps/web/public/casespace-owl.png`:

```bash
node scripts/generate-brand-icons.mjs
```
