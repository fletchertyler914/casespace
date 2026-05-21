# Test Oracle Matrix

Maps P0 flows to acceptance criteria and test suites. All tests trace to requirement IDs in [product-spec-bible.md](../product-spec-bible.md).

**Coverage today:** `pnpm test:parity` and `pnpm test:hardening` validate **backend/integration** oracles. Rows marked `e2e` require **desktop UX** ([ui-port-plan.md](../ui-port-plan.md)) before full product sign-off.

## Oracle conventions

- **AC-*** = acceptance criterion ID
- **Suite:** `unit` | `integration` | `e2e` | `perf` | `security`

## P0 CoreParity oracles

| Flow | AC ID | Criterion | Suite |
|------|-------|-----------|-------|
| FLOW-001 | AC-INGEST-01 | 10k files ingest completes without crash; progress cancellable | perf, integration (`test:hardening`) |
| FLOW-001 | AC-INGEST-02 | File count in DB matches filesystem scan (minus system skips) | integration |
| FLOW-001 | AC-INGEST-03 | Re-open case loads inventory in < 2s for 10k files (target hardware TBD) | perf |
| FLOW-002 | AC-REVIEW-01 | Status change persists and filters correctly | integration, e2e |
| FLOW-002 | AC-REVIEW-02 | Text and image files preview in viewer | e2e |
| FLOW-003 | AC-ARTIFACT-01 | Note/finding/timeline CRUD round-trip | integration |
| FLOW-004 | AC-SEARCH-01 | FTS query returns ranked hits; injection sanitized | unit, integration |
| FLOW-004 | AC-SEARCH-02 | Navigate from search opens correct entity | e2e |
| FLOW-005 | AC-REPORT-01 | Five export types generate non-empty artifacts | e2e |
| FLOW-006 | AC-TIME-01 | Timer start/stop creates valid entry | integration |
| FLOW-006 | AC-TIME-02 | Case switch stops active timer | integration, e2e |
| FLOW-006 | AC-TIME-03 | Billing export matches time entries | integration |
| REQ-SEC-001 | AC-SEC-01 | `../` and out-of-root paths rejected | unit, security (`test:hardening`) |
| REQ-SEC-001 | AC-SEC-02 | delete_case requires confirmation in UI | e2e |

## AI-phase oracles (deferred)

| Requirement | AC ID | Criterion | Suite |
|-------------|-------|-----------|-------|
| REQ-AI-001 | AC-AI-01 | Summary cites source file IDs | integration |
| REQ-AI-002 | AC-AI-02 | Entities exportable to findings | integration |
| REQ-AI-003 | AC-AI-03 | Synthesis lists contradictions with sources | integration |
| REQ-AI-004 | AC-AI-04 | Draft report sections require human approve | e2e |
| REQ-AI-005 | AC-AI-05 | Auto-triage suggestions never auto-apply high-risk status | e2e |
| REQ-AI-006 | AC-AI-06 | Billing narrative matches time entries | integration |

## Fixture requirements

| Fixture | Purpose |
|---------|---------|
| `fixtures/golden/v1-mini.expected.json` | Golden manifest for deterministic seed corpus |
| runtime-generated seed corpus | 50 files mixed types + token checks (`test:hardening`) |
| runtime-generated large corpus | 10k files perf ingest (`test:hardening`) |
| `fixtures/malformed-store.json` | Fail-closed load test (`test:hardening`) |

## CI gates (target)

| Gate | Command / workflow |
|------|-------------------|
| Local parity | `pnpm ops:validate:local` |
| Architecture | `pnpm arch:check` |
| Remote CI | GitHub Actions `CI` workflow |

Record evidence in [readiness.md](../readiness.md) when runs pass.

## Traceability

Full matrix: [traceability-matrix.md](traceability-matrix.md).
