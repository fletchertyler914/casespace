# Native E2E Checklist (Tauri shell)

Run in **`pnpm dev`** (full app). Record pass/fail and date in [readiness.md](../readiness.md). Automated Playwright tests do **not** replace this gate on macOS.

## Setup

- [ ] Clean launch: `pnpm dev` from repo root
- [ ] Fixture case: point source at `fixtures/mini-case/` or a small real folder

## FLOW-001 — Case + ingest

- [ ] Create case with folder source
- [ ] Open case; files appear in navigator/table
- [ ] Sync / ingest shows summary; no crash on re-sync

## FLOW-002 — Review

- [ ] Open text file preview
- [ ] Open image preview (zoom if applicable)
- [ ] Change file status; persists after reload
- [ ] Rename / delete file dialogs work
- [ ] File-changed-on-disk warning + refresh

## FLOW-003 — Artifacts

- [ ] Create/edit note (Tiptap)
- [ ] Create finding with severity
- [ ] Create timeline event

## FLOW-004 — Search

- [ ] Cmd/Ctrl+K search returns file + note hits
- [ ] Navigate from hit opens correct panel/entity

## FLOW-005 — Reports

- [ ] Export narrative (or other type); file written
- [ ] Export history lists entry; open in shell works

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
