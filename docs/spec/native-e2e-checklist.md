# Native E2E Checklist (Tauri shell)

Run in **`pnpm dev`** (full app). Record pass/fail and date in [readiness.md](../readiness.md). Automated Playwright tests do **not** replace this gate on macOS.

**Primary client validation:** CFE / fraud examination — also complete the CFE section in [cfe-workflows.md](cfe-workflows.md).

## Setup

- [ ] Clean launch: `pnpm dev` from repo root
- [ ] Fixture case: point source at `fixtures/mini-case/` or a small real folder

## FLOW-001 — Case + ingest

- [ ] Create case with folder source
- [ ] Open case; files appear in navigator/table
- [ ] Sync / ingest shows summary; no crash on re-sync

## FLOW-002b — Board

- [ ] Switch split → board view
- [ ] Drag file unreviewed → in_review; reload persists
- [ ] Multi-select two cards; drag to flagged; both update
- [ ] Per-lane filter narrows cards
- [ ] Progress dashboard counts match lane totals
- [ ] Folder filter subtitle correct when navigator folder selected
- [ ] Note icon on card when file has linked note
- [ ] Click outside board clears multi-selection

## FLOW-002 — Review

- [ ] Open text file preview
- [ ] Open image preview (zoom if applicable)
- [ ] Change file status; persists after reload
- [ ] Rename / delete file dialogs work
- [ ] File-changed-on-disk warning + refresh

## FLOW-003 — Artifacts

- [ ] Create/edit note (Tiptap)
- [ ] Create finding with severity and linked files
- [ ] Create timeline event with optional source file

## FLOW-004 — Search

- [ ] Cmd/Ctrl+K search returns file + note hits
- [ ] Navigate from hit opens correct panel/entity

## FLOW-005 — Reports

- [ ] Generate case report from reports panel; opens workspace
- [ ] Full report workspace sections load (executive, findings, timeline, inventory, notes)
- [ ] Legacy export history collapsible (optional); generation is primary path

## FLOW-006 — Time

- [ ] Start/stop timer; entry appears in time panel
- [ ] Switch case stops or isolates timer (v1 invariant)

## Duplicates

- [ ] Duplicate groups visible after ingest of identical files
- [ ] Set primary / merge metadata; notes relink to primary

## Security (AC-SEC-02)

- [ ] Delete case requires confirmation dialog

## Sign-off

| Validator | Date | Build/version | Notes |
|-----------|------|---------------|-------|
| | | | |
