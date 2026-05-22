# mini-case fixture

Used by **`tests/command_parity.rs`** (`flow_mini_case_ingest_all_sources`) and manual ingest validation.

- `a.txt` — sample evidence file
- `b.txt` — second sample file
- `README.md` — also scanned by ingest (harmless)

Point a new case source path at this directory (canonical absolute path), then run **Ingest sources** in the desktop app or `pnpm test:parity`.
