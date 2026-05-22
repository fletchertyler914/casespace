# CaseSpace Product Roadmap

Desktop UX and release milestones for `apps/desktop`. Backend command matrix: [command-catalog.md](command-catalog.md). Component map: [desktop-workflow-mapping.md](desktop-workflow-mapping.md). Agent track: [architecture-agents.md](architecture-agents.md).

**Last updated:** 2026-05-22
**Current version:** 0.1.9 (Wave A report library — local-validated pending gate)

## Status summary

| Milestone | Status |
|-----------|--------|
| Foundation + case hub | **Done** |
| Workspace shell, ingest UI, file navigator | **Done** |
| In-app viewers (PDF, Office, media, text) | **Done** — PDF toolbar uses native CaseSpace chrome |
| Notes, findings, timeline panels | **Done (MVP)** |
| Board, duplicates, reports, search | **Done (local)** |
| Time management (day model, list + calendar, billing) | **Done (local)** |
| **Report library Wave A** (CFE long/short, expert witness, engagement letter) | **Shipped in 0.1.9** — citation pills + standards footer |
| Sample case demo flow | **Shipped in 0.1.9** |
| Agent report graph + MCP bridge (Phase B) | **Shipped (local)** — wired in AgentPanel; PMF gate before Wave B templates |
| UX release gate (native E2E) | **Pending** |
| Wave B templates (PI) | **Blocked** — [pmf-gate-eval.md](spec/pmf-gate-eval.md) |

## Release: 0.1.9 (2026-05-22) — Report Library Wave A

- Template library: `cfe-long`, `cfe-short`, `expert-witness-frcp26`, `engagement-letter` ([report-library-research.md](spec/report-library-research.md))
- Citation-backed `ReportDocument` JSON from `generate_case_report(caseId, templateId?)`
- Standards compliance footer (ACFE III.C.2, FRCP 26, FRE 702, SSFS No. 1)
- Report template picker in reports workspace
- Sample fraud examination case (`seed_sample_fraud_case`) + case hub CTA
- Schema v7: `report_export_history.template_id`, `citations_json`
- Phase B: `@repo/agents` MCP server stub, redaction policy, report graph wired to AgentPanel

PMF thesis: [spec/pmf-thesis-cfe.md](spec/pmf-thesis-cfe.md)

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
