# Feature Catalog

All features tagged: `P0-CoreParity` | `P1-CoreParity` | `AI-Phase` | `deferred`

**Snapshot (2026-05-21):** Backend P0 commands largely **implemented** (see [command-parity-ledger.md](../command-parity-ledger.md)). UI column below reflects **desktop UX** only — update rows as [ui-port-plan.md](../ui-port-plan.md) phases land.

| Feature ID | Domain | Feature | Phase tag | Requirement | Status v2 |
|------------|--------|---------|-----------|-------------|-----------|
| F-CASE-01 | cases | Create/list/open/close case | P0-CoreParity | REQ-CASE-001 | partial (hub UI) |
| F-CASE-02 | cases | Case metadata edit | P1-CoreParity | REQ-CASE-001 | planned (U3 tail) |
| F-CASE-03 | cases | Multi-source paths per case | P0-CoreParity | REQ-CASE-001 | backend yes; UI partial |
| F-CASE-04 | cases | Delete case with confirm | P0-CoreParity | REQ-CASE-001 | implemented (hub) |
| F-INGEST-01 | ingest | Directory ingest + persist | P0-CoreParity | REQ-INGEST-001 | backend yes; workspace UI pending |
| F-INGEST-02 | ingest | Large-folder warning | P0-CoreParity | REQ-INGEST-001 | planned |
| F-INGEST-03 | ingest | Metadata extraction on ingest | P0-CoreParity | REQ-INGEST-001 | planned |
| F-INGEST-04 | ingest | Incremental sync / refresh | P1-CoreParity | REQ-INGEST-001 | planned |
| F-INGEST-05 | ingest | Duplicate detection on ingest | P1-CoreParity | REQ-INGEST-001 | planned |
| F-VIEW-01 | viewer | Text file preview | P0-CoreParity | REQ-VIEW-001 | planned |
| F-VIEW-02 | viewer | Image preview | P0-CoreParity | REQ-VIEW-001 | planned |
| F-VIEW-03 | viewer | PDF in-app preview | P1-CoreParity | REQ-VIEW-001 | deferred |
| F-VIEW-04 | viewer | Open externally | P0-CoreParity | REQ-VIEW-001 | partial |
| F-REVIEW-01 | review | Five-state status workflow | P0-CoreParity | REQ-REVIEW-001 | planned |
| F-REVIEW-02 | review | Folder-scoped filter | P0-CoreParity | REQ-REVIEW-001 | planned |
| F-SEARCH-01 | search | FTS global search | P0-CoreParity | REQ-SEARCH-001 | stub |
| F-SEARCH-02 | search | Cmd/Ctrl+K palette | P0-CoreParity | REQ-SEARCH-001 | planned |
| F-NOTE-01 | notes | Create/list/edit/delete notes | P0-CoreParity | REQ-ARTIFACT-001 | partial |
| F-NOTE-02 | notes | Pin note / file note counts | P1-CoreParity | REQ-ARTIFACT-001 | planned |
| F-NOTE-03 | notes | Rich text (Tiptap) | P1-CoreParity | REQ-ARTIFACT-001 | deferred |
| F-FIND-01 | findings | Findings CRUD | P0-CoreParity | REQ-ARTIFACT-001 | partial |
| F-TIME-01 | timeline | Timeline CRUD | P0-CoreParity | REQ-ARTIFACT-001 | partial |
| F-DUP-01 | duplicates | Duplicate groups UI | P1-CoreParity | REQ-INGEST-001 | planned |
| F-REPORT-01 | reports | Evidence index export | P0-CoreParity | REQ-REPORT-001 | planned |
| F-REPORT-02 | reports | Executive summary export | P0-CoreParity | REQ-REPORT-001 | planned |
| F-REPORT-03 | reports | Narrative report export | P0-CoreParity | REQ-REPORT-001 | planned |
| F-REPORT-04 | reports | Financial analysis package | P0-CoreParity | REQ-REPORT-001 | planned |
| F-BILL-01 | time-billing | Start/stop timer | P0-CoreParity | REQ-TIME-001 | partial |
| F-BILL-02 | time-billing | Pause/resume/segments | P1-CoreParity | REQ-TIME-001 | planned |
| F-BILL-03 | time-billing | Billing config + calculations | P0-CoreParity | REQ-TIME-001 | planned |
| F-BILL-04 | time-billing | Invoice export package | P0-CoreParity | REQ-TIME-001 | planned |
| F-SET-01 | settings | Workspace prefs persistence | P1-CoreParity | REQ-CASE-001 | planned |
| F-SET-02 | settings | System file filter | P1-CoreParity | REQ-INGEST-001 | planned |
| F-AI-01 | ai | Document summary | AI-Phase | REQ-AI-001 | deferred |
| F-AI-02 | ai | Entity extraction | AI-Phase | REQ-AI-002 | deferred |
| F-AI-03 | ai | Cross-doc synthesis | AI-Phase | REQ-AI-003 | deferred |
| F-AI-04 | ai | Report drafting assist | AI-Phase | REQ-AI-004 | deferred |
| F-AI-05 | ai | Auto-triage suggestions | AI-Phase | REQ-AI-005 | deferred |
| F-AI-06 | ai | Billing narrative assist | AI-Phase | REQ-AI-006 | deferred |
| F-COLLAB-01 | collab | Team features | deferred | — | out of scope |
