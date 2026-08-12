# Assistant Diagnosis and Treatment Policy

**Stage:** 13  
**Date:** 2026-08-02

## Hard prohibitions

Ask NorthCare must not:

- Diagnose conditions
- Provide treatment recommendations
- Recommend medicines
- Calculate or suggest dosages

## Intent routing

Classifier intents map to fixed boundaries:

| Intent | Outcome |
|---|---|
| `diagnosisRequest` | `diagnosisBoundary` |
| `treatmentRequest` | `treatmentBoundary` |
| `medicationRequest` | `medicationBoundary` |
| `dosageRequest` | `dosageBoundary` |

Implementation: `domain/intents.ts`, `domain/policies.ts`

## Answer path rule

Boundary outcomes **skip retrieval composition**. Fixed policy copy is shown; no generative rewrite; no “helpful” clinical speculation.

## Development content

Synthetic development articles must not masquerade as diagnostic or treatment authority. Development banners remain visible.

## Alignment

Matches `AGENTS.md` health and AI safety rules and `RESPONSIBLE_AI_AND_CLINICAL_SAFETY.md`.

## Related

- `ASSISTANT_CLINICAL_SCOPE.md`
- `ASSISTANT_SOURCE_GROUNDING_POLICY.md`
