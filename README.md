# CaseSpace v2 Monorepo

CaseSpace v2 is an elite, net-new rebuild of the CaseSpace product foundation using a 3-app architecture.

Current status: **planning complete; CoreParity port in progress**. Web/download surface deployed; desktop product parity (ingest, workspace, billing, reports) not yet implemented. See [docs/readiness.md](docs/readiness.md).

## Repository purpose

This repository is the implementation home for:

- `apps/desktop-backend`: Tauri/Rust native core engine
- `apps/desktop`: Next.js desktop UX shell
- `apps/web`: marketing/sales/docs/download surface (no product workflow UI)
- shared packages for contracts, UI, and configuration

v1 reference source path:

- `/Users/tyler/projects/malissa_projects/inventory-generator`

## License

CaseSpace is licensed under the **Business Source License 1.1 (BUSL-1.1)**.

- Source is public for transparency and personal/non-commercial use
- **Commercial use requires a separate license** — see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md)
- On **2029-05-21**, this codebase converts to **Apache 2.0**

Contact for commercial licensing: `fletchertyler914@yahoo.com`

## Core principles

- Preserve v1 business intent and user outcomes
- Rebuild implementation layers for v2 architecture quality
- Optimize for performance, security, scalability, maintainability, and cost efficiency
- Keep architecture extensible for future hybrid monetization

## Documentation map

- `docs/product-spec-bible.md` - canonical product requirements and phase partitioning
- `docs/implementation-readiness-gate.md` - planning / parity / AI gates
- `docs/architecture.md` - v2 architecture (current vs target)
- `docs/readiness.md` - readiness and blockers
- `docs/migrating-from-v1.md` - migration playbook (status-tagged manifest)
- `docs/command-parity-ledger.md` - v1 ↔ v2 command mapping
- `docs/v1-reference.md` - v1 capability inventory
- `docs/spec/` - flows, features, AI matrix, gap analysis, test oracles
- `docs/release-runbook.md` - RC/prod release process
- `docs/release-validation-cli.md` - CLI validation policy

## Quickstart

**Prerequisites:** Node.js **24+**, pnpm **10.19** (see `.nvmrc`)

```bash
corepack enable
pnpm install
```

Run the full desktop app (Tauri shell + Next.js UI + Rust backend):

```bash
pnpm dev
```

This starts `desktop-backend` (`tauri dev`), which automatically runs the `desktop` Next dev server on port 3000.

Optional dev entrypoints:

```bash
pnpm dev:ui    # Next.js UI only in the browser (no Tauri; native commands unavailable)
pnpm dev:web   # marketing site on port 3001
pnpm dev:all   # web + full desktop (Tauri) + @repo/ui watchers (no duplicate Next on :3000)
```

Run lint and type checks:

```bash
pnpm lint
pnpm check-types
```

## Solo Ops Validation

Use these canonical commands:

```bash
pnpm ops:validate:local
pnpm ops:validate
pnpm ops:validate:prod
```

- `ops:validate:local`: full local gates + unified release/web-link contract checks
- `ops:validate`: local gates + remote workflow status discovery
- `ops:validate:prod`: strict production validation (CI/Release success + stable release link checks)

## Live URLs

- Web/marketing: `https://casespace.vercel.app`
- Download page: `https://casespace.vercel.app/download`
- Latest stable desktop release: see [GitHub Releases](https://github.com/fletchertyler914/casespace/releases) (branding/icon updates on main; full parity pending)

## Branding & icons

Canonical owl source: `apps/web/public/casespace-owl.png` (mirrored to `apps/desktop/public/casespace-owl.png`). All app icons, favicons, and store logos are derived from this single asset by `scripts/generate-brand-icons.mjs`.

Regenerate the full icon set after editing the owl source or changing the brand background color:

```bash
node scripts/generate-brand-icons.mjs                             # default warm-dark-gray
node scripts/generate-brand-icons.mjs --color "#14110D"           # explicit hex
node scripts/generate-brand-icons.mjs --color "oklch(0.18 0.01 85)" --preview  # write scripts/.preview-icon.png only
```

The script bakes the rounded squircle into every layer (including each `.icns` slice — macOS does not apply a system mask to app icons) and writes Tauri, web, and desktop favicons in one pass.

`scripts/clean-owl-source.mjs` is a one-shot patch already applied to the committed `casespace-owl.png` to remove the small ink-blot artifact from the original v1 artwork (a cluster of transparent + dark pixels around `(610, 567)`). Re-run it only if the canonical source is ever restored from the raw v1 asset.

## Notes

- Implemented baseline: backend/desktop command-workflow scaffolding and release-pipeline definitions.
- Validation boundary: full v1 parity still requires remaining migration phase gates.
