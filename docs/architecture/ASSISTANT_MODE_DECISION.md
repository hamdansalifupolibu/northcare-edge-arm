# Assistant Mode Decision

**Stage:** 13  
**Date:** 2026-08-02  
**Status:** Decided

## Modes

Canonical modes (`apps/mobile/src/features/assistant/domain/modes.ts`):

| Mode | Meaning | Stage 13 |
|---|---|---|
| `CURATED_RETRIEVAL` | Answer from approved retrieved article blocks only | **Active** when packs load and coverage passes |
| `CONSTRAINED_GENERATION` | Future grounded generative rewrite over retrieved blocks | **Unavailable** — interface only |
| `DEVELOPMENT_SIMULATION` | Dev-only path over synthetic packs | **Dev-gated** |
| `UNAVAILABLE` | No approved content / provider / coverage | **Active** fail-closed default in production |

## Stage 13 decision

**Use curated retrieval or unavailable.** Do not activate constrained generation.

Rationale:

- Zero `APPROVED_FOR_PILOT` knowledge packs.
- No approved on-device or remote generative runtime.
- Retrieval-only composition is reviewable, testable, and fail-closed.
- Generative rewriting would invent transitions/facts without an approved model evaluation.

## Selection rules (summary)

1. Production/staging with zero pilot packs → `UNAVAILABLE`.
2. Development with synthetic pack → retrieval against `APPROVED_FOR_DEVELOPMENT` content; answers tagged with development banner; mode may surface as `CURATED_RETRIEVAL` or `DEVELOPMENT_SIMULATION` per provider wiring.
3. Generative provider (`future-constrained-generative-v1`) always `available: false`.

## Explicit non-goals

- Free-form chatbot mode
- Silent fallback from retrieval to LLM
- Claiming “AI thinking” UX copy for retrieval search

## Related

- `ASK_NORTHCARE_ARCHITECTURE.md`
- `LOCAL_ASSISTANT_MODEL_EVALUATION.md`
- `implementation/assistant-provider-inventory.json`
