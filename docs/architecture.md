# CaseSpace v2 Architecture

This is the architecture target for CaseSpace v2.

## System shape

CaseSpace v2 is a 3-app monorepo:

- `apps/desktop-backend`: native/core engine (Tauri + Rust)
- `apps/desktop`: desktop UX shell (Next.js)
- `apps/web`: future browser surface

Shared packages provide reusable contracts and UI primitives.

```mermaid
flowchart LR
  subgraph apps [Apps]
    desktopBackend[apps/desktop-backend]
    desktop[apps/desktop]
    web[apps/web]
  end

  subgraph packages [Packages]
    typesPkg[packages/types]
    uiPkg[packages/ui]
    sharedCfg[shared configs]
  end

  desktop --> typesPkg
  desktop --> uiPkg
  web --> typesPkg
  web --> uiPkg
  desktop -->|command adapters| desktopBackend
  desktopBackend -->|domain contracts| typesPkg
  sharedCfg --> desktop
  sharedCfg --> web
```

## Responsibility boundaries

### `apps/desktop-backend`

Owns:

- domain command layer
- persistence and schema migrations
- file-system interactions
- ingestion/scanning/extraction pipelines
- security-sensitive operations and capability policy

### `apps/desktop`

Owns:

- analyst-facing desktop workflows
- UI state orchestration
- typed command adapter layer to backend
- offline-first UX behavior

### `apps/web`

Owns:

- web-safe subset of product features
- workflows that do not require local native capabilities
- future collaboration/browser use-cases

## v1 to v2 architectural relationship

v1 is a single-package desktop application. v2 intentionally separates concerns:

- backend-native concerns move into `apps/desktop-backend`
- desktop UX concerns move into `apps/desktop`
- web-safe expansion is isolated to `apps/web`

This separation improves modularity, maintainability, and long-term scalability.

## Domain and contract layering

Target layering:

1. Domain contracts (`packages/types`)
2. Backend command/domain implementation (`apps/desktop-backend`)
3. Desktop adapters and workflows (`apps/desktop/lib/*`)
4. Presentation components (`apps/desktop/components/*`)

Rules:

- UI never bypasses command adapters.
- Commands never depend on UI modules.
- Shared contract types are versioned and explicit.

## Security model

Key controls:

- strict path validation for file operations
- constrained capability permissions
- sanitized and bounded search queries
- guarded destructive operations with explicit UX confirmation

## Performance model

Core goals:

- preserve v1-grade ingest and search performance outcomes
- enforce p95 budgets for interactive workflows
- isolate heavy workloads in backend/native layers
- keep desktop UI responsive through async orchestration

## Extensibility model

CaseSpace v2 is closed-source-first today, but architecture is extension-ready:

- feature flags at module boundaries
- domain contracts that support optional premium modules later
- additive monetization paths that do not mutate core business logic

## Current known gaps in this repository

- `apps/desktop-backend` currently has scaffold-level behavior only
- `apps/desktop` currently has starter-level pages
- command contracts and shared domain packages are not implemented yet

See `docs/readiness.md` and `docs/migrating-from-v1.md` for migration sequencing and gate criteria.
