# Pricing & Packaging — Report Library

**Status:** Adopted (2026-05-22)  
**Related:** [pmf-thesis-cfe.md](pmf-thesis-cfe.md), [competitive-position.md](competitive-position.md)

## Tiers (Wave A)

| Tier | Price | Templates | Features |
|------|-------|-----------|----------|
| **Free** | $0 | `cfe-short`, `engagement-letter` | Deterministic composer, sample case demo |
| **Pro** | $39/mo · $390/yr · $499 perpetual + 1yr support | + `cfe-long`, `expert-witness-frcp26` | Standards-compliance footer, citation pills in UI |
| **Pro+** (post Phase B) | +$20/mo | + `pi-surveillance`, `pi-background`, `fraud-incident-log` | Agent-backed citation drafting |

## Template gating (implementation)

- Free templates: no license check in Wave A (honor system + future license key).
- Pro templates: UI shows lock badge + upgrade CTA when `casespace.license.tier !== 'pro'`.
- Wave B templates: hidden until PMF gate clears ([pmf-thesis-cfe.md](pmf-thesis-cfe.md)).

## Competitive anchor

- CaseFleet Advanced AI: **$75/user/mo** (cloud, annual billing).
- CaseSpace Pro: **$39/mo** local-first, optional perpetual.

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-22 | Expert-witness in Pro tier | Highest-dollar CFE deliverable; moat vs. Word |
| 2026-05-22 | Agent drafting in Pro+ only | Phase B cost; preserves free eval path |
| 2026-05-22 | Perpetual $499 option | Differentiator vs. subscription-only competitors |

## Open items

- License key / activation flow (not in Wave A scope)
- DOCX export gates Pro (export pipeline deferred)
