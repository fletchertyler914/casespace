# Report Library Research

**Last updated:** 2026-05-22  
**Related:** [pmf-thesis-cfe.md](pmf-thesis-cfe.md), [cfe-workflows.md](cfe-workflows.md)

## Authoritative sources

| Standard | Source | Key requirement |
|----------|--------|-----------------|
| ACFE Code III.C.2 | [ACFE Professional Standards](https://www.acfe.com/) | No opinion on legal guilt/innocence |
| ACFE FEM Reporting | [ACFE Sample Documents](https://testsc.acfe.com/fraud-resources/sample-documents) | Short + long fraud examination report templates |
| FRCP 26(a)(2)(B) | [Cornell LII Rule 26](https://www.law.cornell.edu/rules/frcp/rule_26) | Expert written report: opinions, basis, facts/data, exhibits, qualifications, prior testimony, compensation |
| FRE 702 / Daubert | Federal Rules of Evidence | Testable methodology, generally accepted |
| AICPA SSFS No. 1 | [AICPA SSFS](https://www.aicpa-cima.com/resources/download/statement-on-standards-for-forensic-services) | No ultimate fraud occurrence opinion |
| IIA Global Standards 2025 | [IIA Standards](https://www.theiia.org/) | Audit report structure (deferred template) |

## Persona catalog

### CFE / Fraud Examination (Wave A)

| Template ID | ACFE / industry basis | Sections |
|-------------|----------------------|----------|
| `cfe-long` | ACFE long-form examination report | Header, Executive Summary, Scope, Approach, Findings, Chronology, Evidence Index, Recommendations |
| `cfe-short` | ACFE short-form report | Header, Executive Summary, Findings, Chronology, Evidence Index |
| `expert-witness-frcp26` | FRCP 26(a)(2)(B) + FRE 702 | Opinions & Basis, Facts/Data, Exhibits, Qualifications, Prior Testimony, Compensation, Methodology, Findings, Chronology, Evidence Index |
| `engagement-letter` | ACFE engagement proposal pattern | Parties, Scope, Deliverables, Limitations, Fees, Confidentiality |

### Private Investigation (Wave B — post PMF gate)

| Template ID | Basis | Sections |
|-------------|-------|----------|
| `pi-surveillance` | PI industry standard | Introduction, Subject Profile, Observation Log, Evidence, Summary, Recommendations |
| `pi-background` | Due diligence / OSINT | Introduction, Scope, OSINT Findings, Interviews, Field Verification, Conclusions |
| `fraud-incident-log` | ACFE incident log | Date, Nature, Parties, Actions, Conclusions |

### Deferred

| Template ID | Blocker |
|-------------|---------|
| `internal-audit-iia` | Management response field |
| `expert-damages-aicpa` | Structured financial workpapers |

## CaseSpace artifact mapping

| Artifact | Report use |
|----------|------------|
| `cases` | Header, scope context |
| `findings` + `linked_files` | Findings, opinions (must cite evidence) |
| `timeline_events` + `source_file_id` | Chronology, observation log |
| `notes` | Working notes, interview memos, approach |
| `files` | Evidence index, exhibits |
| `time_entries` + billing | Compensation section (expert witness) |

## Compliance checks (footer)

| Check ID | Template(s) | Rule |
|----------|-------------|------|
| `ACFE-III.C.2` | cfe-* | No guilt/innocence language |
| `ACFE-EVIDENCE` | cfe-*, expert-* | Findings cite linked files when present |
| `FRCP-26-B` | expert-witness-frcp26 | Required sections present |
| `FRE-702` | expert-witness-frcp26 | Methodology section present |
| `SSFS-NO-ULTIMATE` | cfe-*, expert-* | No ultimate fraud occurrence opinion |
