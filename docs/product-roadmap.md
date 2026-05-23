# CaseSpace Product Roadmap

Desktop UX and release milestones for `apps/desktop`. Backend command matrix: [command-catalog.md](command-catalog.md). Component map: [desktop-workflow-mapping.md](desktop-workflow-mapping.md). Agent track: [architecture-agents.md](architecture-agents.md).

**Last updated:** 2026-05-22
**Current version:** 0.1.11 local (evidence-to-report pipeline — local-validated pending release)

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
| **Evidence-to-report pipeline** (extract → analyze → approve → draft) | **Shipped in 0.1.11 local** |
| Agent report graph + MCP bridge (Phase B) | **Implemented locally** — multi-node graph: extract → per-file analyze → aggregate → review → draft |
| UX release gate (native E2E) | **Pending** |
| Wave B templates (PI) | **Blocked** — [pmf-gate-eval.md](spec/pmf-gate-eval.md) |

## Release: 0.1.11 (local, 2026-05-22) — Evidence-to-Report Pipeline

- Schema v8: `file_text_extracts` + FTS5, `ai_*_drafts`, `ai_run_log`
- Text extraction: PDF text layer, DOCX, XLSX/CSV, plain text; Tesseract OCR fallback for scans
- Commands: `extract_file_text`, `extract_case_text`, `analyze_file_with_ai`, `analyze_case_with_ai`, draft approve/reject, `count_approved_ai_findings`
- `@repo/agents` report graph upgraded: extract → per-file analyze → corpus aggregate → review interrupt → AI report draft
- UI: `AnalyzeCaseButton` in reports workspace, `ApprovalsQueue` renders finding/timeline/entity drafts with page anchors
- Reports badge: "Includes N approved AI findings"

## Release: 0.1.10 (local, 2026-05-22) — AI Report Drafting

- `generate_ai_case_report(caseId, templateId?)` calls an OpenAI-compatible provider from the Tauri process using `OPENAI_API_KEY` / `CASESPACE_OPENAI_API_KEY`
- Model output is limited to section prose; CaseSpace preserves section ids, citations, standards checks, and language-scan validation
- Reports workspace and AgentPanel now use AI drafting, with deterministic `generate_case_report` retained as a fallback/source-grounding path
- MCP tool policy exposes `generate_ai_case_report` as an autonomous report tool

## Release: 0.1.9 (2026-05-22) — Report Library Wave A

- Template library: `cfe-long`, `cfe-short`, `expert-witness-frcp26`, `engagement-letter` ([report-library-research.md](spec/report-library-research.md))
- Citation-backed `ReportDocument` JSON from `generate_case_report(caseId, templateId?)`
- Standards compliance footer (ACFE III.C.2, FRCP 26, FRE 702, SSFS No. 1)
- Report template picker in reports workspace
- Sample fraud examination case (`seed_sample_fraud_case`) + case hub CTA
- Schema v7: `report_export_history.template_id`, `citations_json`
- Phase B: `@repo/agents` MCP server stub, redaction policy, report graph wired to AgentPanel
- AI report drafting follow-up: `generate_ai_case_report(caseId, templateId?)` uses `OPENAI_API_KEY` / `CASESPACE_OPENAI_API_KEY` from the desktop process, then validates and returns the same citation-backed `ReportDocument`

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
