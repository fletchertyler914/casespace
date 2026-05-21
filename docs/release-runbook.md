# CaseSpace Release Runbook

## Overview

This runbook defines release operations for macOS + Windows desktop artifacts.

## Environments

- `dev`: branch validation and internal testing
- `rc`: release candidate tags (`vX.Y.Z-rc.N`)
- `prod`: stable tags (`vX.Y.Z`)

## Release process

1. Merge qualified changes to `main`.
2. Create RC tag `vX.Y.Z-rc.N`.
3. Validate RC assets, download links, and smoke checks.
4. Promote RC to PROD via `Promote RC to Prod` workflow.
5. Validate stable release assets and web download resolution.

## Required checks before promotion

- CI workflow green (lint/type/build + desktop matrix auto-build)
- Security gates pass
- Performance and offline checks pass
- Download-link verification script passes against latest stable release

## Rollback

- Revert web download resolver to previous stable tag if latest fails.
- Mark release as pre-release or yank from user-facing docs if needed.
- Open incident and publish mitigation notes in release channel.
