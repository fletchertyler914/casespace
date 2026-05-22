# Test Oracle Matrix

Maps P0 flows to acceptance criteria and test suites. All tests trace to requirement IDs in [product-spec-bible.md](../product-spec-bible.md).

## Coverage today (2026-05-21)

| Layer | Command | Scope |
|-------|---------|--------|
| Backend integration | `pnpm test:parity` | 16 Rust flows — `parity_flows.rs` (9) + `command_parity.rs` (7): ingest module, mini-case fixture, FTS all entities, reports, duplicates |
| Backend hardening | `pnpm test:hardening` | Security, seed corpus, 10k ingest, malformed store |
| Desktop unit + component | `pnpm test:desktop` | 146 Vitest tests — lib, hooks, 65-command contract, artifacts/billing/viewer components |
| Desktop UI E2E | `pnpm test:e2e` | 11 Playwright tests — hub, workspace, search, artifacts, duplicates, billing/reports, delete-case (mocked Tauri on :3099) |
| Local gate | `pnpm ops:validate:local` | arch, lint, types, parity, hardening, **desktop tests**, build |

Rows marked **native E2E** still require manual smoke in the full Tauri shell (`pnpm dev`) — see [native-e2e-checklist.md](native-e2e-checklist.md).

Closeout status: [v1-parity-closeout.md](v1-parity-closeout.md).

## Oracle conventions

- **AC-*** = acceptance criterion ID
- **Suite:** `unit` | `component` | `integration` | `e2e` | `perf` | `security`

## P0 CoreParity oracles

| Flow | AC ID | Criterion | Suite |
|------|-------|-----------|-------|
| FLOW-001 | AC-INGEST-01 | 10k files ingest completes without crash | perf, integration (`test:hardening`) |
| FLOW-001 | AC-INGEST-02 | File count in DB matches filesystem scan | integration (`test:parity`) |
| FLOW-002 | AC-REVIEW-01 | Status change persists and filters correctly | integration, e2e (mocked browser) |
| FLOW-002 | AC-REVIEW-02 | Text and image files preview in viewer | component + **native E2E** |
| FLOW-003 | AC-ARTIFACT-01 | Note/finding/timeline CRUD round-trip | integration (`test:parity`) |
| FLOW-004 | AC-SEARCH-01 | FTS query returns ranked hits | integration + unit (`command-client`) |
| FLOW-004 | AC-SEARCH-02 | Navigate from search opens correct entity | component + e2e (mocked browser) |
| FLOW-005 | AC-REPORT-01 | Five export types generate non-empty artifacts | integration + **native E2E** |
| FLOW-006 | AC-TIME-01 | Timer start/stop creates valid entry | integration (`test:parity`) |
| FLOW-006 | AC-TIME-02 | Case switch stops active timer | integration + **native E2E** |
| FLOW-006 | AC-TIME-03 | Billing export matches time entries | integration |
| REQ-SEC-001 | AC-SEC-01 | `../` and out-of-root paths rejected | security (`test:hardening`) |
| REQ-SEC-001 | AC-SEC-02 | delete_case requires confirmation in UI | component (`delete-case-confirmation-dialog`) + e2e (`delete-case.spec.ts`) + **native E2E** |

## Desktop test layout

| Path | Purpose |
|------|---------|
| `apps/desktop/lib/**/*.test.ts` | Pure unit (preview, validation, mapping, command-client) |
| `apps/desktop/hooks/**/*.test.ts` | Hook unit (panel sizing) |
| `apps/desktop/components/**/*.test.tsx` | Component (search, rename, delete, badges) |
| `apps/desktop/e2e/*.spec.ts` | Playwright browser E2E with `e2e/mock-invoke.browser.js` |
| `apps/desktop/lib/invoke-bridge.ts` | Injectable/mockable Tauri invoke |

## CI gates

| Gate | Command / workflow |
|------|-------------------|
| Local parity | `pnpm ops:validate:local` |
| Desktop UX tests | `pnpm test:desktop` + `pnpm test:e2e` (also in CI `quality` job) |
| Architecture | `pnpm arch:check` |
| Remote CI | GitHub Actions `CI` workflow |

Record evidence in [readiness.md](../readiness.md) when runs pass.

## Traceability

Full matrix: [traceability-matrix.md](traceability-matrix.md).
