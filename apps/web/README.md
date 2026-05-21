# CaseSpace Web App (`apps/web`)

This app is the CaseSpace marketing/sales/docs/download surface.

Current state: implemented baseline for marketing/docs/download routes; remaining work is release-proof validation and content hardening.

## Role in v2 architecture

- Own product marketing and positioning pages.
- Provide live desktop download links to published GitHub Release assets.
- Own docs/pricing/contact routes.
- Must not implement product workspace routes or native command workflows.

## Local development

Run only this app:

```bash
pnpm --filter web dev
```

Default dev URL:

- `http://localhost:3001`

## Quality checks

```bash
pnpm --filter web lint
pnpm --filter web check-types
```

## References

- `docs/architecture.md`
- `docs/readiness.md`
- `docs/migrating-from-v1.md`
