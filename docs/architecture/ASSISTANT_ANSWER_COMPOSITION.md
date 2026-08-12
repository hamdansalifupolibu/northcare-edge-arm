# Assistant Answer Composition

**Stage:** 13  
**Date:** 2026-08-02  
**Status:** Implemented (retrieval-only)

## Composer

`RESPONSE_COMPOSER_VERSION = 1`  
Implementation: `apps/mobile/src/features/assistant/response/composer.ts`

**Retrieval-only:** answers are assembled from approved article `approvedAnswer` blocks and mapped citations. The composer does **not**:

- Invent transitions, facts, or clinical conclusions
- Call a generative model
- Paraphrase beyond structured block selection
- Fill gaps when coverage is insufficient

## Inputs

- Ranked candidates that passed coverage
- Answerability: `answerAvailable` | `multipleRelevantSources`
- Mode, language, development banner, timestamps
- Knowledge pack id/version from selected articles

## Outputs

`ComposedAssistantAnswer` includes:

- Heading and rich-text blocks from approved content
- Citations / source references
- Article ids, pack id/version
- Engine/composer/index version stamps
- Optional development banner

Clinical articles without source references fail closed (no answer).

## Multiple sources

When several strong candidates remain, composition presents multiple relevant sources rather than merging into a single invented narrative.

## Generative path

`CONSTRAINED_GENERATION` composition is **not** wired for Stage 13 production use. The future provider interface exists but returns unavailable.

## Fallbacks

Boundary and unavailable states use fixed policy copy (`domain/policies.ts`, `response/fallback.ts`) — never generated clinical advice.

## Related

- `ASSISTANT_MODE_DECISION.md`
- `docs/safety/ASSISTANT_SOURCE_GROUNDING_POLICY.md`
