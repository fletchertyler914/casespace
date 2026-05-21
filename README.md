# CaseSpace v2 Monorepo

CaseSpace v2 is an elite, net-new rebuild of the CaseSpace product foundation using a 3-app architecture.

Current status: **implemented + deployed web/download surface; validated: CI, release assets, and Vercel production deploy**.

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

- `docs/architecture.md` - v2 architecture and ownership boundaries
- `docs/readiness.md` - current readiness and blockers
- `docs/migrating-from-v1.md` - deterministic migration playbook and contract matrix
- `docs/v1-reference.md` - consolidated v1 capability inventory
- `docs/release-runbook.md` - RC/prod release process and promotion flow
- `docs/release-validation-cli.md` - automated CLI validation policy (`release:status` and `release:validate`)

## Quickstart

Install dependencies:

```bash
pnpm install
```

Run workspace dev tasks:

```bash
pnpm dev
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
- Latest stable desktop release: `v0.1.2` (GitHub Releases)

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
