# CaseSpace Product Spec Bible

Canonical product specification for CaseSpace v2. All implementation, migration, and test work traces to requirement IDs defined here.

**v1 reference:** `/Users/tyler/projects/malissa_projects/inventory-generator`  
**v2 implementation:** this monorepo (`apps/desktop-backend`, `apps/desktop`, `apps/web`)

## North star

Build a **solo-operator case operating system** that preserves v1 outcomes on an elite architecture, proves end-to-end reliability, then adds AI-native automation as a post-parity phase.

- **Same product outcomes** (ingest, review, artifacts, reports, billing)
- **Redesigned implementation** (modular backend, production persistence, typed contracts)
- **Parity first, AI second** (see [Core Parity Build Gate](#core-parity-build-gate))

## Strategic decisions (locked)

| Decision | Value |
|----------|--------|
| Launch wedge | Solo / private investigators |
| Launch scope | Single-user; no team/collab features |
| Deployment | Desktop, offline-first; optional cloud assists |
| Execution order | Core parity → E2E validation → AI-native phase |
| PII cloud default | Per-case toggle; **redacted-cloud** default |
| Success metrics | Speed + throughput + quality/defensibility (weighted) |

## Personas

### Primary: Solo investigator / analyst

- Handles 1–many cases concurrently
- Ingests large folder trees; reviews mixed file types
- Produces defensible reports and billing artifacts
- Wants one workspace instead of Explorer + Excel + Word + PDF + notes + timer apps

### Secondary (post-wedge): Financial analyst, criminal defense, court-ordered work

- Same core flows; report templates and compliance emphasis may differ (P1/P2)

### Explicitly not for launch

- Multi-user collaboration, shared case libraries, enterprise RBAC, cloud-primary SaaS workspace

## Problem statement

Case workers lose time to repetitive paperwork, tool switching, manual metadata entry, and report assembly. CaseSpace removes drudgery by unifying ingest → review → synthesis → billing → final deliverables in one fast, intuitive desktop workflow.

## Competitive positioning

No single direct competitor is assumed. Benchmark against:

1. **Manual stack** — file explorer, PDF viewer, spreadsheets, Word, notes app, separate time tracker
2. **Adjacent tools** — e-discovery / investigation suites (feature breadth, not UX simplicity)
3. **v1 baseline** — performance and output quality of `inventory-generator`

Win dimensions: time-to-final-report, ingest throughput, billing capture completeness, defensibility of outputs, simplicity for solo ops.

## Phase partitioning

| Phase | Scope |
|-------|--------|
| **CoreParity** | All P0 non-AI workflows; production persistence; FTS search; viewer MVP; time/billing core |
| **AINative** | Summaries, entities, synthesis, report drafting assist, auto-triage, billing narrative assist |

AI work is **blocked** until the **UX Parity Build Gate** passes ([ui-port-plan.md](ui-port-plan.md); backend gate already passed locally).

## P0 launch outputs (locked)

- Investigation narrative report
- Financial analysis report package
- Executive case summary
- Evidence index / appendix
- Billing / invoice package

## P0 launch flows (locked)

1. Create case → add sources → ingest/index
2. Review / preview → status / tag triage
3. Notes / findings / timeline linked to evidence
4. Report assembly and export (non-AI templates first)
5. Integrated time tracking and billing capture

## Requirement index

| ID | Title | Phase | Appendix |
|----|-------|-------|----------|
| REQ-CASE-001 | Case CRUD and source management | CoreParity | [commands](spec/commands-and-contracts.md) |
| REQ-INGEST-001 | Fast directory ingest and inventory persistence | CoreParity | [data-model](spec/data-model-and-state.md) |
| REQ-VIEW-001 | Multi-format file preview (MVP) | CoreParity | [user-flows](spec/user-flows-and-ux-invariants.md) |
| REQ-REVIEW-001 | Five-state file review workflow | CoreParity | [user-flows](spec/user-flows-and-ux-invariants.md) |
| REQ-ARTIFACT-001 | Notes, findings, timeline CRUD | CoreParity | [commands](spec/commands-and-contracts.md) |
| REQ-SEARCH-001 | FTS search across files and artifacts | CoreParity | [commands](spec/commands-and-contracts.md) |
| REQ-REPORT-001 | Report assembly and export | CoreParity | [user-flows](spec/user-flows-and-ux-invariants.md) |
| REQ-TIME-001 | Integrated time tracking and billing | CoreParity | [data-model](spec/data-model-and-state.md) |
| REQ-SEC-001 | Path validation and destructive-op guards | CoreParity | [perf-security](spec/perf-security-reliability-gates.md) |
| REQ-AI-001 | Document summary and key points | AINative | [ai-matrix](spec/ai-capability-matrix.md) |
| REQ-AI-002 | Entity extraction | AINative | [ai-matrix](spec/ai-capability-matrix.md) |
| REQ-AI-003 | Cross-document synthesis | AINative | [ai-matrix](spec/ai-capability-matrix.md) |
| REQ-AI-004 | Report drafting with citations | AINative | [ai-matrix](spec/ai-capability-matrix.md) |
| REQ-AI-005 | Workflow auto-triage suggestions | AINative | [ai-matrix](spec/ai-capability-matrix.md) |
| REQ-AI-006 | Billing narrative assistance | AINative | [ai-matrix](spec/ai-capability-matrix.md) |

## Must-preserve behaviors (from v1)

- Case-first navigation (not folder-picker home)
- Fast case open with persisted inventory
- Five-state file review model
- Cmd/Ctrl+K global search with navigation to hits
- Timer auto-stop on case switch
- Large-folder warning before bulk ingest
- Destructive operations require confirmation
- Case-scoped path access for file read/write/open

## Intentional v2 improvements (do not port v1 flaws)

- Monolithic `lib.rs` → domain modules under `commands/`, `domain/`, `persistence/`
- JSON file store → SQLite + migrations + FTS5
- Mega UI components → composable workspace modules
- Global path file open → case-root-scoped validation only
- Substring search → FTS with sanitization and ranking

## Discovery Q&A (summary)

See [spec/discovery-appendix.md](spec/discovery-appendix.md) for full Q&A and decision records.

## Traceability

- [Traceability matrix](spec/traceability-matrix.md) — FlowStep → Feature → Command → Data → UI → Tests
- [Feature catalog](spec/feature-catalog.md) — tagged P0-CoreParity / P1 / AI-Phase
- [User flow map](spec/user-flow-map.md)
- [AI capability matrix](spec/ai-capability-matrix.md)
- [Test oracle matrix](spec/test-oracle-matrix.md)

## Spec appendices

| Document | Purpose |
|----------|---------|
| [spec/commands-and-contracts.md](spec/commands-and-contracts.md) | IPC and command contracts |
| [spec/data-model-and-state.md](spec/data-model-and-state.md) | Entities, schema, persistence |
| [spec/user-flows-and-ux-invariants.md](spec/user-flows-and-ux-invariants.md) | Flows and UX rules |
| [spec/test-oracle-matrix.md](spec/test-oracle-matrix.md) | Acceptance and test oracles |
| [spec/perf-security-reliability-gates.md](spec/perf-security-reliability-gates.md) | NFR and gates |
| [spec/out-of-scope.md](spec/out-of-scope.md) | Launch exclusions |
| [spec/v1-flaw-remediation.md](spec/v1-flaw-remediation.md) | Anti-patterns |

## Core Parity Build Gate

Defined in [implementation-readiness-gate.md](implementation-readiness-gate.md). AI phase cannot start until gate passes.

## Related migration docs

- [migrating-from-v1.md](migrating-from-v1.md)
- [command-parity-ledger.md](command-parity-ledger.md)
- [persistence-mapping.md](persistence-mapping.md)
- [desktop-workflow-mapping.md](desktop-workflow-mapping.md)
- [gap-analysis-master.md](spec/gap-analysis-master.md)
