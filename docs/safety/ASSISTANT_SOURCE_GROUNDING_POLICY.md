# Assistant Source Grounding Policy

**Stage:** 13  
**Date:** 2026-08-02

## Rule

Every retrieval answer must be grounded in approved knowledge-pack article blocks with citeable source metadata. Ungrounded generative text is out of scope for Stage 13.

## Requirements

- Answers come from `approvedAnswer` blocks on loadable articles.
- Citations map from article `sourceReferences` / pack sources.
- Clinical-flagged articles without sources fail closed (no answer).
- Insufficient coverage fails closed — do not invent filler.
- Multiple strong matches present sources; do not silently fuse into uncited prose.

## Development honesty

Synthetic pack sources must label themselves as development fixtures — not WHO, UNICEF, GHS, or other clinical issuers.

## Generative future

Any future `CONSTRAINED_GENERATION` provider must only rewrite over **already retrieved approved blocks** and must retain citations. That path is unavailable until model evaluation and approval.

## Related

- `docs/architecture/ASSISTANT_ANSWER_COMPOSITION.md`
- `ASSISTANT_DIAGNOSIS_TREATMENT_POLICY.md`
