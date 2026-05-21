# CaseSpace v2 Monorepo

CaseSpace v2 is an elite, net-new rebuild of the CaseSpace product foundation using a 3-app architecture.

Current status: **foundation + migration documentation complete, core implementation in progress**.

## Repository purpose

This repository is the implementation home for:

- `apps/desktop-backend`: Tauri/Rust native core engine
- `apps/desktop`: Next.js desktop UX shell
- `apps/web`: future browser surface
- shared packages for contracts, UI, and configuration

v1 reference source path:

- `/Users/tyler/projects/malissa_projects/inventory-generator`

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

## Notes

- This repository currently contains scaffold-level app code plus execution-grade migration docs.
- Do not assume v1 feature parity is implemented until migration phases are completed and quality gates pass.
