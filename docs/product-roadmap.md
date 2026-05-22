# CaseSpace Product Roadmap

Desktop UX and release milestones for `apps/desktop`. Backend command matrix: [command-catalog.md](command-catalog.md). Component map: [desktop-workflow-mapping.md](desktop-workflow-mapping.md). Agent track: [architecture-agents.md](architecture-agents.md).

**Last updated:** 2026-05-22
**Current version:** 0.1.8 (local-validated)

## Status summary

| Milestone | Status |
|-----------|--------|
| Foundation + case hub | **Done** |
| Workspace shell, ingest UI, file navigator | **Done** |
| In-app viewers (PDF, Office, media, text) | **Done** — PDF toolbar uses native CaseSpace chrome |
| Notes, findings, timeline panels | **Done (MVP)** |
| Board, duplicates, reports, search | **Done (local)** |
| Time management (day model, list + calendar, billing) | **Done (local)** — validated 2026-05-22 with `pnpm ops:validate:local` |
| Agent scaffold (`@repo/agents` + AgentPanel stub) | **Shipped in 0.1.8 (UI inert)** — see [architecture-agents.md](architecture-agents.md) §Spike log |
| UX release gate (native E2E) | **Pending** — [spec/native-e2e-checklist.md](spec/native-e2e-checklist.md) |
| AI-native features (live graphs, report agent, autosuggest) | **Blocked** until UX gate |

## PDF viewer

- Engine: `@react-pdf-viewer` + `pdf.worker.min.js`
- Chrome: `components/viewer/pdf-toolbar.tsx` — Lucide + shadcn `Button`, not library toolbar icons
- Controls: search, zoom, page nav, print, download
- No thumbnail sidebar (outline-only workflows use file navigator)

## Release: 0.1.8 (2026-05-22)

- Day-based time tracking schema (`time_entries` keyed by `case_id + entry_date`, segment reparenting + v6 repair migration)
- `TimerWidget` rewrite (idle/running/paused, RAF tick, daily summary on stop)
- `TimeManagementPage` (list + calendar + slide-in day panel) reachable from case `⋮` menu
- Billing dialogs polish: config validation, segment create/edit validation, delete-entry confirmation
- Workflow prompts on case open/close
- `@repo/agents` scaffolding (tool policy + report/supervisor graph stubs + MCP tool defs)
- Desktop `AgentPanel` + `ApprovalsQueue` UI stubs

Local evidence (run on 2026-05-22):

```
pnpm test:parity        # 11 parity + 4 hardening tests passing
pnpm test:desktop       # 161 vitest tests passing
pnpm test:e2e           # 12 playwright tests passing
pnpm build              # CaseSpace_0.1.8_aarch64.dmg bundled with ad-hoc signing
```

## Remaining before release gate

1. Manual E2E on [spec/user-flow-map.md](spec/user-flow-map.md)
2. Report PDF/DOCX export (optional)
3. Production signing + updater ([release-runbook.md](release-runbook.md))
4. Agent C1 (MCP bridge + Sqlite checkpointer) — see [architecture-agents.md](architecture-agents.md) §Implementation phases

## Validation

```bash
pnpm ops:validate:local
pnpm dev   # manual checklist
```
