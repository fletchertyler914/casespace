# V1 Parity Closeout — Status and Next Phases

**Last updated:** 2026-05-21

## What “closed” means

| Track | Status | Evidence |
|-------|--------|----------|
| **Backend command parity** | **Closed (local)** | `pnpm test:parity` (16 integration flows), `pnpm test:hardening` |
| **Desktop UI implementation** | **Closed (local)** | U1–U10 per [ui-port-plan.md](../ui-port-plan.md); [gap-analysis-ui-workflows.md](gap-analysis-ui-workflows.md) |
| **Automated UI tests** | **Closed (local)** | `pnpm test:desktop` (146), `pnpm test:e2e` (11, mocked on :3099) |
| **UX Parity Build Gate** | **Open** | Manual `pnpm dev` walkthrough on [user-flow-map.md](user-flow-map.md) |
| **AINative** | **Blocked** | Until UX gate |
| **Production distribution** | **Open** | Signing, notarization, live updater keys |

## Test layers (use the right gate)

```text
Rust command-path (native engine)  →  pnpm test:parity
  parity_flows.rs     — DB/FTS/merge/schema flows
  command_parity.rs   — ingest module, mini-case fixture, reports, FTS all entity types

Rust hardening        →  pnpm test:hardening

Next UI (mocked IPC)  →  pnpm test:desktop + pnpm test:e2e

Full Tauri shell      →  pnpm dev + native checklist (macOS; WebDriver N/A on Mac)
```

## Remaining UX depth (post-closeout, not blockers for backend gate)

1. **Board** — multi-select, lane filters, rich cards ([ui-port-plan.md](../ui-port-plan.md) U7 tail)
2. **Reports** — PDF/DOCX export (markdown done)
3. **Native smoke** — PDF/DOCX preview, timer on case switch, dialog flows ([native-e2e-checklist.md](native-e2e-checklist.md) when added)

## Next phases (locked order)

1. **Earn UX Parity Build Gate** — manual E2E + board review; record in [readiness.md](../readiness.md)
2. **Optional:** Linux CI WebDriver for automated native UI (macOS dev stays manual)
3. **AINative** — per [ai-capability-matrix.md](ai-capability-matrix.md)
4. **Release/prod** — `pnpm release:validate` after signing/updater configured

## Commands (solo ops)

```bash
pnpm ops:validate:local   # full local gate before merge
pnpm test:parity          # backend + command-path integration
pnpm dev                  # native UX gate validation
```
