# CaseSpace Web App (`apps/web`)

This app is the future browser-facing CaseSpace surface.

Current state: scaffold-level shell.

## Role in v2 architecture

- Own web-safe workflows that do not require local Tauri-native capabilities.
- Reuse shared contracts and UI primitives from `packages/*`.
- Expand only after desktop core migration reaches stability gates.

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
