# CaseSpace v2 Monorepo

CaseSpace v2 is an elite, net-new rebuild of the CaseSpace product foundation using a 3-app architecture.

Current status (2026-05-21, post evidence-based source re-audit): **Core Parity backend complete (local)**. **UX port is a shallow MVP** (~30–40% of v1 user-flow surface) — case CRUD, ingest/sync, folder-tree navigator, viewer routing for 15 file categories, plain-text artifact CRUD, status-lane board, MVP timer + markdown report exports. **Known shipped-but-broken / shipped-but-shallow areas:** global search dialog (runtime contract mismatch), `merge_duplicate_metadata` (doesn't relink artifacts), no inventory data grid, no viewer metadata/rename/delete UI, no Tiptap rich-text editors, no column/mapping config UI, no production code-signing or updater. Full evidence and re-prioritized critical path: [`docs/spec/gap-analysis-ui-workflows.md`](docs/spec/gap-analysis-ui-workflows.md), [`docs/spec/gap-analysis-master.md`](docs/spec/gap-analysis-master.md), [`docs/readiness.md`](docs/readiness.md), [`docs/ui-port-plan.md`](docs/ui-port-plan.md). AINative + production distribution remain blocked.

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
- `docs/ui-port-plan.md` - active UI port phases (U1–U11) and UX gate
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
pnpm install   # uses pnpm-lock.yaml; CI uses --frozen-lockfile
```

**Dependency policy:** Next.js is pinned in `pnpm-workspace.yaml` (`catalog:` → **16.2.6**). Bump only by editing the catalog and reviewing the lockfile diff. Root `minimumReleaseAge` (48h) blocks very fresh package publishes.

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

- **Backend:** P0 commands, SQLite/FTS, ingest v2, parity + hardening — validated locally.
- **Desktop UX:** Hub (U1–U3 MVP), workspace shell + viewer routing + panel MVP (U4–U6); U7–U11 still need real depth — see [docs/spec/gap-analysis-master.md](docs/spec/gap-analysis-master.md) rewritten critical path and [docs/ui-port-plan.md](docs/ui-port-plan.md).
- **AINative:** blocked until UX Parity Build Gate passes (not yet earned).
- **Production distribution:** blocked until `tauri-plugin-updater` + Developer ID + Windows signing + notarization land.
