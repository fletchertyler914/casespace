# CaseSpace Release Runbook

## Overview

This runbook defines release operations for macOS + Windows desktop artifacts.

## Environments

- `dev`: branch validation and internal testing
- `rc`: release candidate tags (`vX.Y.Z-rc.N`)
- `prod`: stable tags (`vX.Y.Z`)

## Release process

1. Merge qualified changes to `main`.
2. Create RC tag `vX.Y.Z-rc.N`.
3. Validate RC assets, download links, and smoke checks.
4. Promote RC to PROD via `Promote RC to Prod` workflow.
5. Validate stable release assets and web download resolution.

## Required checks before promotion

- CI workflow green (lint/type/build + desktop matrix auto-build on Node 24)
- `pnpm ops:validate:local` passes on release branch
- Download-link verification script passes against latest stable release (`verify-release-links` job on stable tags)

**Planned (CoreParity, not yet CI-enforced):** dedicated security suite, perf regression harness, offline E2E parity tests. Track in [spec/perf-security-reliability-gates.md](spec/perf-security-reliability-gates.md).

## CLI automation

Run these from the repo root:

```bash
pnpm ops:validate:local
pnpm ops:validate
pnpm ops:validate:prod
pnpm release:status
pnpm release:validate
```

Notes:

- `release:status` prints latest run states for `CI`, `Release`, and `Promote RC to Prod`.
- `release:validate` enforces successful latest `CI` + `Release`, validates stable release assets, and runs `scripts/verify-release-links.mjs`.
- `ops:validate:local` is the canonical solo-ops local gate (quality + build + release-system integrity checks).
- `ops:validate` is the canonical day-to-day command (local gate + remote workflow status).
- `ops:validate:prod` is the canonical production sign-off command.
- To validate live website `/download` resolution, set `CASESPACE_WEB_URL`:

```bash
CASESPACE_WEB_URL="https://your-domain.com" pnpm ops:validate:prod
```

Detailed command policy (when/how to use each):

- `docs/release-validation-cli.md`

## Rollback

- Revert web download resolver to previous stable tag if latest fails.
- Mark release as pre-release or yank from user-facing docs if needed.
- Open incident and publish mitigation notes in release channel.
