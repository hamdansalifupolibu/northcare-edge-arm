# Risk Explainability Model

Worker-facing explanations are **versioned content fragments** on rules — never LLM-generated text.

## Fragment fields

`explanationId`, `version`, `summary`, `detail`, `reviewStatus`, `sourceReferences`

## Presentation rules

- Show priority label + summary + matched factors + missing information  
- Do not show raw boolean expressions, JSON, SQL, stack traces, or secret scores  
- Do not use probabilistic percentages  
- Development packs must display a non-clinical banner  

Interface strings (`riskStrings`) are separate from clinical/explanation content in rule packs.
