# AI Capability Matrix

**Phase:** All rows are `AI-Phase` — blocked until Core Parity Build Gate passes.

Default PII policy: **redacted-cloud** per case; raw-cloud opt-in with consent.

## Matrix

| AI ID | Workflow step | AI role | Runtime tier | Risk | Guardrails | Requirement | Test |
|-------|---------------|---------|--------------|------|------------|-------------|------|
| AI-01 | After file indexed | suggest | redacted-cloud-default | low | User applies tag/status | REQ-AI-005 | e2e |
| AI-02 | File selected | assist | redacted-cloud-default | low | Show confidence; no auto-write | REQ-AI-001 | integration |
| AI-03 | Case corpus ready | suggest | redacted-cloud-default | medium | Review panel before save | REQ-AI-002 | integration |
| AI-04 | Multi-doc analysis | suggest | redacted-cloud-default | medium | Citations required | REQ-AI-003 | integration |
| AI-05 | Report compose | suggest | redacted-cloud-default | medium | Human approve export | REQ-AI-004 | e2e |
| AI-06 | Timer stop / export | assist | local-preferred | low | No auto invoice submit | REQ-AI-006 | integration |

## AI role definitions

| Role | Behavior |
|------|----------|
| none | No AI in this step (CoreParity) |
| assist | AI generates side-panel content; user copies or applies |
| suggest | AI proposes action; one-click apply for low risk |
| auto-execute | Not used for launch (high-risk blocked) |

## Runtime tiers

| Tier | When |
|------|------|
| local-required | Indexing, timer, path ops — never cloud |
| local-preferred | Small doc summary if SLM available |
| redacted-cloud-default | Entity extract, synthesis, drafts |
| raw-cloud-opt-in | User enables per case; audit log |

## Human vs agent mode (post-parity)

- **Human mode:** user drives every step; AI panels optional
- **Agent mode:** background jobs run suggest/assist tasks on queue; high-risk still requires approval

Agent orchestration design deferred to AINative implementation phase.

## Feature mapping

| Feature | Matrix rows |
|---------|-------------|
| F-AI-01 | AI-02 |
| F-AI-02 | AI-03 |
| F-AI-03 | AI-04 |
| F-AI-04 | AI-05 |
| F-AI-05 | AI-01 |
| F-AI-06 | AI-06 |

## Out of scope for AI launch

- Auto-delete files
- Auto-merge duplicates without confirm
- Auto-submit invoices
- Training on customer data without explicit opt-in
