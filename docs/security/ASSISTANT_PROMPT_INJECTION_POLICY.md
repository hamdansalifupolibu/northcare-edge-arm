# Assistant Prompt Injection Policy

**Stage:** 13  
**Date:** 2026-08-02

## Context

Stage 13 is **retrieval-only**. There is no production prompt to an LLM. Injection risk is therefore limited, but still relevant for:

- Future constrained generative providers
- Knowledge-pack content that might try to override UI safety copy
- Worker-entered text that must not change system behaviour

## Rules

1. Worker questions must **not** elevate privileges, disable safety boundaries, or switch modes.
2. Retrieved article text must not be treated as executable instructions that override diagnosis/treatment/urgent policies.
3. Intent classification and coverage gates run **before** trusting answer composition.
4. Generative provider interface must ignore instruction-like content in retrieved blocks that attempts to remove refusals — when/if activated after evaluation.
5. Development simulation must remain environment-gated and production-blocked.

## Stage 13 posture

With generative providers unavailable, the primary defence is architectural: no model prompt execution path in production.

## Related

- `docs/architecture/ASSISTANT_MODE_DECISION.md`
- `ASSISTANT_QUERY_PRIVACY.md`
