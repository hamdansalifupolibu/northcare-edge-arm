# Assistant Knowledge Storage Decision

**Stage:** 13  
**Date:** 2026-08-02  
**Status:** Decided

## Decision

**Bundled TypeScript knowledge packs** (reviewable source modules), loaded through an environment-gated registry.

| Store | Used for knowledge articles? | Used for |
|---|---|---|
| TypeScript modules under `features/assistant/content/` | **Yes** | Packs, topics, articles, citations |
| AsyncStorage | **No** | — |
| SQLite | **No** (articles) | Feedback + content-issue **metadata only** (migration 007) |

## Why bundled TypeScript

- Diffable in PR review and code review.
- Versioned with app releases; checksum validation at load.
- No silent mutation of clinical-adjacent text on device.
- Aligns with screening / risk / nutrition content patterns.

## Why not AsyncStorage

- Not suitable for governed clinical-reference content.
- Harder to audit, checksum, and gate by environment.
- Risk of stale or user-mutated “knowledge” without release discipline.

## Why SQLite is limited

Migration `007_assistant_feedback.ts` creates:

- `assistant_feedback`
- `assistant_content_issues`

These tables store worker feedback categories and optional notes — **not** knowledge text, chat transcripts, or raw questions as first-class searchable corpora.

## Registry gates

`content/registry.ts`:

- Production/staging: `APPROVED_FOR_PILOT` only (**count: 0** → unavailable).
- Development: also loads `APPROVED_FOR_DEVELOPMENT` synthetic pack.

## Inventory

`implementation/assistant-knowledge-pack-inventory.json`

## Related

- `ASSISTANT_CONTENT_VERSIONING.md`
- `docs/development/ASSISTANT_DEVELOPMENT_CONTENT.md`
