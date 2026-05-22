# Discovery Appendix

Formal Q&A and decision records for Product Spec Bible. Each answer maps to requirement IDs and tests.

## Who is the product for?

**Launch:** Solo private investigators and solo analysts (financial, defense, court-ordered).  
**Not launch:** Teams, shared workspaces, enterprise RBAC.

**Requirement:** REQ-CASE-001, REQ-INGEST-001  
**Tests:** e2e solo workflow smoke

## What problem costs them today?

- Hours in Explorer + Excel + Word + PDF tools
- Manual metadata and status tracking
- Re-keying notes/findings into reports
- Lost billable time (separate timer apps)
- Repetitive triage on large evidence sets

**Requirement:** REQ-INGEST-001, REQ-TIME-001, REQ-REPORT-001

## Why does CaseSpace win?

Unified workspace, fast ingest, integrated review, defensible report outputs, billing woven into workflow — without enterprise bloat.

## What does "elite but simple" mean?

- Case hub → one workspace; minimal settings surface
- Table-first review (kanban optional P1)
- Command palette search (Cmd/Ctrl+K)
- Progressive disclosure; no mapping wizard at launch
- AI suggestions appear as optional assists after parity gate

## AI autonomy vs permission

| Risk tier | Default |
|-----------|---------|
| Low (summarize draft, suggest tags) | Suggest; one-click apply |
| Medium (bulk metadata, cross-doc synthesis) | Suggest + review panel |
| High (write file, delete, merge duplicates, billing totals) | Human confirmation required |

**Requirement:** REQ-AI-001 through REQ-AI-006, REQ-SEC-001

## Legal / defensibility overrides

- Final report export requires human review checkpoint (CoreParity templates)
- Destructive file/case ops always confirmed
- Audit log for high-risk commands (P1 hardening)
- PII: redacted-cloud default per case

## Decision records

| ID | Decision | Rationale |
|----|----------|-----------|
| DR-001 | Solo-first launch | Fastest path to paying wedge; avoids collab scope |
| DR-002 | Parity before AI | Reduces risk; AI measured against stable baseline |
| DR-003 | Redacted-cloud PII default | Trust + performance balance |
| DR-004 | SQLite + FTS for v2 | v1-proven; JSON store is scaffold only |
| DR-005 | Defer PDF/Office rich viewers to P1 | Launch MVP: text/image + external open |
| DR-AGENT-001 | LangGraph + CaseSpace MCP + optional Arcade; Agent mode for routine ops; destructive via interrupt | See [architecture-agents.md](../architecture-agents.md); v1 export port out of scope |
| DR-AGENT-002 | Reports = generation (`generate_case_report`), not v1 export UX | Aligns with dead v1 export buttons |

## Open items (resolve during CoreParity)

- Numeric ingest throughput SLO (files/min on reference hardware)
- Report template canonical formats per segment
- v1 DB import tool scope (one-way ETL vs fresh-only)
