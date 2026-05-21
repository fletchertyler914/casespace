# Dependency and Integration Gap Analysis (v1 -> v2)

## Scope and source refs

- **v1:** `inventory-generator/Cargo.toml`, `package.json`, `tauri.conf.json`
- **v2:** `casespace/apps/desktop-backend/src-tauri/Cargo.toml`, `apps/desktop/package.json`

## Dependency inventory table

| dependency | layer | v1 usage | v2 status | classification | recommendation | launch tier | risk | test |
|------------|-------|----------|-----------|----------------|----------------|-------------|------|------|
| sqlx | rust | SQLite core | absent | portable-with-redesign | adopt | P0 | medium | integration |
| tokio | rust | async I/O | absent | portable-with-redesign | adopt | P0 | low | integration |
| sha2 | rust | file hash | absent | portable-with-redesign | adopt | P0 | low | unit |
| walkdir | rust | scan | present | portable-as-is | keep | P0 | low | unit |
| tauri-plugin-opener | tauri | open files | present | portable-as-is | keep | P0 | low | e2e |
| tauri-plugin-dialog | tauri | pick folders | absent | portable-with-redesign | adopt | P0 | low | e2e |
| tauri-plugin-log | tauri | logging | absent | portable-with-redesign | adopt | P0 | low | — |
| tauri-plugin-updater | tauri | updates | placeholder | defer | defer | P2 | high | — |
| symphonia | rust | audio meta | declared unused | defer | defer | P2 | medium | — |
| calamine/rust_xlsxwriter | rust | excel | unused in src | defer | defer | P2 | low | — |
| @react-pdf-viewer | frontend | PDF | lazy viewer | defer | defer | P1 | medium | e2e |
| mammoth/xlsx-js-style | frontend | office | lazy viewer | defer | defer | P1 | medium | e2e |
| @tiptap/* | frontend | rich notes | notes UI | defer | defer | P1 | medium | e2e |
| zustand | frontend | state | absent | portable-with-redesign | adopt | P0 | low | unit |
| date-fns | frontend | time UI | absent | portable-with-redesign | adopt | P0 | low | unit |
| cmdk | frontend | search UI | absent | portable-with-redesign | adopt | P0 | low | e2e |

## Keep/adopt

- Tauri 2, serde, chrono, uuid, opener, walkdir (ingest)
- sqlx (rustls), tokio, sha2, regex
- @tauri-apps/api, date-fns, zustand (desktop)
- dialog, log, process plugins

## Replace

- `tauri-plugin-sql` → sqlx-only migrations
- native-tls sqlx → rustls
- Vite shell → Next.js 16
- React 18 → React 19 (verify pdf/tiptap when adopted)

## Defer/optional

- symphonia, remeta, calamine, rust_xlsxwriter
- @react-pdf-viewer, mammoth, xlsx-js-style, full tiptap
- tauri-plugin-updater until signed releases
- OCR/AI provider SDKs (AINative)

## Risk register

| risk_id | dependency_area | risk_desc | severity | mitigation | decision |
|---------|-----------------|-----------|----------|------------|----------|
| DE-R01 | sqlx | Migration cutover failure | critical | Phased + fixtures | adopt P0 |
| DE-R02 | CSP | v2 `csp: null` | high | Restore CSP | P0 |
| DE-R03 | PDF worker | Next asset paths | medium | Defer in-app PDF | P1 |
| DE-R04 | React 19 | Viewer lib compat | medium | Compatibility pass | P1 |
| DE-R05 | Binary size | symphonia all | medium | Don't port all features | defer |
| DE-R06 | BUSL | Third-party NOTICE | low | Maintain NOTICE file | keep |

## Launch-safe baseline dependency set

**Rust:** tauri 2, opener, dialog, log, process, serde, chrono, uuid, sqlx+sqlite, tokio, sha2, regex, walkdir

**Desktop:** next, react 19, @tauri-apps/api, @repo/types, @repo/ui, zustand, date-fns, cmdk (minimal radix via ui package)

**Excluded from P0:** symphonia, remeta, pdf viewer stack, tiptap, updater
