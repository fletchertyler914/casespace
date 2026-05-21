# Phase Gate Checklist

## Phase 1: Deployment Pipeline

- [ ] CI workflow green on macOS + Windows
- [ ] Release workflow publishes deterministic assets
- [ ] Web download page resolves latest stable assets by OS/arch
- [ ] Rollback path validated

## Phase 2: Core Migration

- [ ] Shared contracts package in use
- [ ] Backend core domain commands implemented and tested
- [ ] Command-risk controls and tests implemented
- [ ] Desktop workflow adapters integrated

## Phase 3: Net-New Features

- [ ] OCR preview/extraction path implemented
- [ ] AI report generation with fallback path implemented
- [ ] Cost controls and feature flags configured
- [ ] No regressions in Phase 2 gates
