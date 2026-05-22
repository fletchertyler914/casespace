# PMF Thesis — Solo CFE / Fraud Examiner

**Status:** Adopted (2026-05-22)  
**Owner:** Product  
**Related:** [cfe-workflows.md](cfe-workflows.md), [report-library-research.md](report-library-research.md), [competitive-position.md](competitive-position.md)

## Thesis

CaseSpace wins the **solo CFE / fraud examiner** segment by being the only **local-first desktop workspace** that produces a **Daubert-defensible, citation-backed examination or expert-witness report** from a case's existing evidence corpus **in under 60 seconds**.

Standards conformance (ACFE Code III.C.2, FRCP 26(a)(2)(B), FRE 702/Daubert, AICPA SSFS No. 1) is rendered visibly on every deliverable. Every claim links back to a file, finding, note, or timeline event id stored locally in SQLite.

## Wedge (three stacked differentiators)

1. **Local-first privacy** — Sensitive engagement data never leaves the examiner's machine. Cloud competitors cannot serve clients whose engagement letters or counsel forbid cloud processing.
2. **Citation-backed drafting** — Every section emits `{ text, citations: [{ kind, id, anchor, label }] }`. Counsel verifies in seconds.
3. **Standards-compliance footer** — Each export carries per-rule verified / not_applicable / missing_data status. CFE hands report to litigation counsel without repackaging.

## Success metrics (60 days post Wave A)

| Metric | Target | How measured |
|--------|--------|--------------|
| Time-to-first-export (sample case) | < 60 seconds from first launch | Manual CFE demo session |
| Time-to-final-report (real engagement) | < 1 hour synthesis (vs. industry 3–5 days) | CFE self-report in discovery call |
| Draft acceptance rate | >= 70% sections kept without rewrite | Direct customer interview |
| Paying CFE conversion from sample case | >= 30% of demoed prospects | Direct sales conversation |
| Standards-conformance pushback | 0 rejections by counsel | CFE follow-up survey |

Telemetry is **deferred** — validated via direct customer conversations ([cfe-discovery-log.md](cfe-discovery-log.md)).

## PMF gate (Wave A → Wave B + Phase B agent)

After 30 days of Wave A shipped:

- Convert **3 of 5** CFE prospects to paying or written commitment, **OR**
- **5 new** CFE prospects through sample-case demo with **>= 30%** paid conversion, **AND**
- Average draft acceptance rate **>= 70%** from at least 3 measured engagements.

| Outcome | Action |
|---------|--------|
| Gate hit | Ship Wave B (PI templates) + Phase B agent overlay |
| Miss on conversion | Revise pricing / packaging only |
| Miss on draft acceptance | Improve deterministic composer before any agent work |

## Explicit "no" list (before PMF gate)

- IIA internal-audit template (needs management-response field)
- AICPA forensic-damages workpapers (needs structured financial schema)
- Multi-user collaboration / cloud sync (erases local-first wedge)
- PowerPoint deck generation
- In-app telemetry (defer to conversations)
- Arcade external SaaS connectors

## Traceability

Update when PMF scope changes: [product-roadmap.md](../product-roadmap.md), [pricing-packaging.md](pricing-packaging.md), [architecture-agents.md](../architecture-agents.md).
