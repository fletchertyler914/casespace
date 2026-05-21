# Release Validation via CLI

This guide defines when and how to use automated CLI release checks.

## Commands

- `pnpm release:status`
- `pnpm release:validate`
- `pnpm ops:validate:local`
- `pnpm ops:validate:remote`
- `pnpm ops:validate`
- `pnpm ops:validate:prod`
## Solo-ops canonical flow

For one-person operations, use this deterministic command stack:

1. `pnpm ops:validate:local`
   - run all local quality gates and unified release-system contract checks
2. `pnpm ops:validate`
   - run local gates plus remote workflow status discovery
3. `pnpm ops:validate:prod`
   - run strict prod validation (latest successful CI + Release + stable asset checks)

Use `ops:validate` as your day-to-day default. Use `ops:validate:prod` only for release sign-off.

### `ops:validate:local` includes

- `pnpm arch:check`
- `pnpm lint`
- `pnpm check-types`
- `pnpm build`
- `node ./scripts/validate-unified-release-system.mjs`

The unified release-system contract check ensures local cohesion between:

- deterministic release asset naming in `release.yml`
- web `/download` release resolver integration
- required root automation scripts


## When to use each command

### Use `pnpm release:status` when:

- checking current workflow health during daily development
- verifying whether `CI`, `Release`, and `Promote RC to Prod` have recent runs
- triaging failed pipelines before attempting promotion

### Use `pnpm release:validate` when:

- preparing to promote an RC to prod
- completing a prod push and collecting validation evidence
- confirming that release assets satisfy web download resolver requirements

## What each command enforces

### `release:status`

- prints latest run state and URL for:
  - `CI`
  - `Release`
  - `Promote RC to Prod`
- does not fail on missing or failed runs

### `release:validate`

- fails unless latest `CI` run is `completed/success`
- fails unless latest `Release` run is `completed/success`
- fails if no stable release exists
- runs `scripts/verify-release-links.mjs` and fails if required asset patterns are missing
- optionally checks live `/download` page if `CASESPACE_WEB_URL` is set

## Environment variables

- `GITHUB_REPOSITORY` or `CASESPACE_RELEASE_REPO`: target repo (`owner/name`)
- `GITHUB_TOKEN`: optional; falls back to `gh auth token`
- `CASESPACE_WEB_URL`: optional; enables live website `/download` probe

## Standard prod validation sequence

1. Push/produce RC and run release pipeline.
2. Promote RC to prod.
3. Run `pnpm ops:validate:prod`.
4. If website is deployed, run:

```bash
CASESPACE_WEB_URL="https://your-domain.com" pnpm ops:validate:prod
```

5. Record evidence links:
   - latest successful `CI` run URL
   - latest successful `Release` run URL
   - prod release URL and asset names
   - `/download` page probe result (when applicable)

## Failure handling

- Any failure is a release gate stop.
- Fix the failing workflow or asset issue first, then rerun the failing command.
- Do not claim production validation complete until `ops:validate:prod` succeeds.
