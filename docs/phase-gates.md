# Phase Gate Checklist

## Phase 1: Deployment Pipeline

- [x] CI workflow definitions and architecture guard implemented
- [x] Release workflow definitions and deterministic asset naming implemented
- [x] Web download page implemented with release-aware asset resolution logic
- [x] Rollback runbook drafted
- [ ] Live GitHub Actions CI matrix run proven green (macOS + Windows)
- [ ] Live release publishing proven with real artifacts
- [ ] Live download links validated against published stable release assets

## Phase 2: Core Migration

- [x] Shared contracts package in use (`@repo/types`)
- [x] Backend core command scaffolding implemented and locally tested
- [x] Command-risk baseline controls and unit tests implemented
- [x] Desktop workflow adapters integrated (initial vertical slice)
- [ ] Full command/API matrix domain coverage completed
- [ ] Production-grade persistence + migration model completed
- [ ] Full core workflow parity tests completed

## Phase 3: Net-New Features

- [x] OCR preview fallback path implemented
- [x] AI report generation fallback path implemented
- [ ] Full OCR extraction pipeline completed
- [ ] Production AI/report automation quality harness completed
- [ ] Cost controls and feature flags configured end-to-end
- [ ] No regressions in Phase 2 gates
