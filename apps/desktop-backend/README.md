# CaseSpace Desktop Backend (`apps/desktop-backend`)

This app is the native/core backend engine for CaseSpace v2.

Current state: **Core Parity backend complete (local)** — SQLite/FTS, ingest v2 (multi-source, incremental sync, duplicate rebuild), full P0 non-AI command matrix, parity + hardening suites. **UX port U7–U11** is frontend-only. Remaining backend: module split (`commands/*`), AI commands (post-UX gate), remote release proof.

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

## Code signing and updates

**Local development** uses ad-hoc macOS signing (`bundle.macOS.signingIdentity: "-"` in `tauri.conf.json`). This is sufficient for `pnpm dev` and local `tauri build` smoke tests.

**Production releases** require a valid **Apple Developer ID** signing identity (not ad-hoc). Configure `bundle.macOS.signingIdentity` to your Developer ID Application certificate before shipping to users.

The updater plugin is wired with placeholder config in `tauri.conf.json` (`plugins.updater.pubkey` and `endpoints`). Before enabling in-app updates:

1. Generate signing keys: `pnpm tauri signer generate -w ~/.tauri/casespace.key`
2. Set `plugins.updater.pubkey` to the generated public key content (not a file path)
3. Point `plugins.updater.endpoints` at your release JSON host
4. Set `bundle.createUpdaterArtifacts` to `true` when building release artifacts

Until those are configured, `check_for_update` returns `null` (no update available).

## Tests (native engine)

```bash
pnpm test:parity      # from repo root — parity_flows + command_parity (ingest/FTS/reports)
pnpm test:hardening   # security, 10k ingest, seed corpus
```

`tests/command_parity.rs` exercises the same Rust modules as Tauri commands (`ingest`, `fts_search`, `build_report_body`) against `fixtures/mini-case/`.

## Implementation notes

- Command-risk and hardening requirements are defined in `docs/migrating-from-v1.md`.
- Readiness/blockers: `docs/readiness.md`
- V1 closeout: `docs/spec/v1-parity-closeout.md`
- Desktop UX port (separate app): `docs/ui-port-plan.md`
- v1 command and capability reference is documented in `docs/v1-reference.md`.
