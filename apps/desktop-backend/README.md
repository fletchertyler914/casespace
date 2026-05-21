# CaseSpace Desktop Backend (`apps/desktop-backend`)

This app is the native/core backend engine for CaseSpace v2.

Current state: implemented Tauri-native command baseline with local validation; remaining work is production persistence, full matrix coverage, and remote release proof.

## Role in v2 architecture

- Own Tauri command handlers and native integrations.
- Own persistence schema/migrations and data access patterns.
- Own security boundaries for filesystem and destructive operations.

## Intended runtime relationship

- `apps/desktop` (Next desktop UX) calls this backend through typed command contracts.
- `apps/web` does not directly depend on native-only capabilities.

## Local development

**Recommended:** from the repo root:

```bash
pnpm dev
```

Equivalent:

```bash
pnpm --filter desktop-backend dev
```

`tauri dev` runs this package and, via `beforeDevCommand` in `tauri.conf.json`, starts `pnpm --filter desktop dev:next` for the Next.js UI at `http://localhost:3000`.

This package does not own a separate desktop UI. It wraps the Next frontend from `apps/desktop` via Tauri (`devUrl` / `frontendDist` in `tauri.conf.json`).

## Implementation notes

- Command-risk and hardening requirements are defined in `docs/migrating-from-v1.md`.
- Readiness/blockers are tracked in `docs/readiness.md`.
- v1 command and capability reference is documented in `docs/v1-reference.md`.
