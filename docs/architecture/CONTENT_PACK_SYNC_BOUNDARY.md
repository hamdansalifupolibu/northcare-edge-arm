# Content Pack Sync Boundary

**Stage:** 14  
**Status:** No production publishing of synthetic packs

## Decision

Content packs (screening templates, risk rule packs, nutrition packs, Ask NorthCare knowledge packs, voice schemas) are **not** published into production via Stage 14 sync.

## Rules

- Synthetic / `APPROVED_FOR_DEVELOPMENT` packs must never be promoted to production through the sync API.
- Production may only receive packs that are explicitly `APPROVED_FOR_PILOT` (or stronger) through a future controlled publishing path.
- Stage 14 sync focuses on operational clinical records and related metadata, not content-pack distribution.

## Follow-up

A later stage may define signed content-pack manifests, version pinning, and admin publishing with audit. Not started here.
