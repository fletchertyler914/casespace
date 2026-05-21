# CaseSpace Desktop UX (`apps/desktop`)

This app is the Next.js desktop UX shell for CaseSpace v2.

Current state: scaffold-level shell; migration-rebuild in progress.

## Role in v2 architecture

- Host analyst-facing desktop workflows.
- Own UI state orchestration and feature composition.
- Call `apps/desktop-backend` through typed command adapters/contracts.

## Local development

Run only desktop app:

```bash
pnpm --filter desktop dev
```

Default dev URL:

- `http://localhost:3000`

## Quality checks

```bash
pnpm --filter desktop lint
pnpm --filter desktop check-types
```

## Notes

- This is intentionally Next.js-first for v2.
- Feature parity with v1 is tracked in `docs/migrating-from-v1.md`.

## References

- `docs/architecture.md`
- `docs/readiness.md`
- `docs/migrating-from-v1.md`
- `docs/v1-reference.md`
