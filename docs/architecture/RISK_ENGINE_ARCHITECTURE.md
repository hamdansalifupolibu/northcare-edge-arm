# Risk Engine Architecture

**Product:** NorthCare AI  
**Engine version:** `RISK_ENGINE_VERSION = 1`  
**Location:** `apps/mobile/src/features/risk/`

## Layers

| Layer | Path | Responsibility |
|---|---|---|
| Domain | `domain/` | Priorities, rule pack types, input/result contracts, errors |
| Engine | `engine/` | React-independent evaluation, conditions, aggregation, validation |
| Content | `content/` | Rule-pack registry + synthetic development packs |
| Application | `application/` | Evaluate / save / get / recalculate use cases |
| UI | `components/`, `screens/` | Result presentation, acknowledgement, history |
| Persistence | Stage 6 repos + migration 003 | `risk_assessments`, `risk_factors` |

## Determinism

Same screening answers, measurements, client/visit context, rule-pack version, and engine version → same priority, matched factors, missing information, and explanations. Evaluation timestamp is recorded after deterministic calculation. No `eval`, `Function`, remote executable content, LLM, or random values.

## Production fail-closed

Production loads only `APPROVED_FOR_PILOT` packs. With zero pilot packs, UI state is `rulePackUnavailable` — never synthetic fallback, never GREEN by default.
