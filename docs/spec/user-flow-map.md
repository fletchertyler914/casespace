# User Flow Map

End-to-end flows for solo investigator launch. Each step links to features and phase tags.

## FLOW-001: Case setup and ingest (P0-CoreParity)

```mermaid
flowchart TD
  start[OpenApp] --> caseList[CaseList]
  caseList --> createCase[CreateCaseWithSources]
  createCase --> openCase[OpenCase]
  openCase --> loadDb{InventoryInDB}
  loadDb -->|yes| navigator[FileNavigator]
  loadDb -->|no| countFiles[CountDirectory]
  countFiles --> largeWarn{OverThreshold}
  largeWarn -->|yes| confirmIngest[UserConfirms]
  largeWarn -->|no| ingest[IngestFiles]
  confirmIngest --> ingest
  ingest --> navigator
```

| Step | Feature IDs | Commands (target) | UI surface |
|------|-------------|-------------------|------------|
| Create case | F-CASE-01, F-CASE-03 | `create_case` | Case hub dialog |
| Open case | F-CASE-01, F-INGEST-01 | `load_case_files_with_inventory` | Workspace shell |
| Ingest | F-INGEST-01, F-INGEST-02 | `ingest_files_to_case` | Progress + navigator |

**Failure paths:** path error, cancel ingest, partial failure with retry  
**Tests:** e2e, integration, perf  
**AI role:** none

## FLOW-002: Review and triage (P0-CoreParity)

```mermaid
flowchart LR
  nav[Navigator] --> select[SelectFile]
  select --> preview[PreviewFile]
  preview --> status[SetStatus]
  status --> filter[FilterByStatus]
  filter --> nav
```

| Step | Feature IDs | Commands | UI |
|------|-------------|----------|-----|
| Preview | F-VIEW-01, F-VIEW-02, F-VIEW-04 | `read_file_text`, `open_file` | Viewer pane |
| Status | F-REVIEW-01 | `update_file_status` | Status control |

## FLOW-003: Artifacts (P0-CoreParity)

Notes, findings, timeline linked to case (and optionally file).

| Artifact | Create | List | Update/delete |
|----------|--------|------|---------------|
| Note | P0 | P0 | P0 target |
| Finding | P0 | P0 | P0 target |
| Timeline | P0 | P0 | P0 target |

## FLOW-004: Search (P0-CoreParity)

Cmd/Ctrl+K → query → ranked results → navigate to entity.

**AI:** none

## FLOW-005: Report assembly (P0-CoreParity)

Aggregate artifacts + file index → export 4 report types + evidence index.

**AI:** none at CoreParity (templates only)

## FLOW-006: Time and billing (P0-CoreParity)

Timer in header → entries → billing config → invoice export.

**Invariant:** timer stops on case switch (UX-003)

## AI-phase flow overlay (blocked)

After Core Parity gate — see [ai-capability-matrix.md](ai-capability-matrix.md).

| Flow step | AI role | Feature |
|-----------|---------|---------|
| Post-ingest | suggest | F-AI-05 auto-triage |
| File select | assist | F-AI-01 summary |
| Report view | suggest | F-AI-04 draft sections |
| Billing export | assist | F-AI-06 narrative |
