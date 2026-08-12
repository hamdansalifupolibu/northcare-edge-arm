# Nutrition Guidance Safety Boundary

**Stage:** 12  
**Date:** 2026-08-02

## Scope

Defines what nutrition guidance **is** and **is not** in NorthCare AI Stage 12.

## Guidance is

- Deterministic cards from approved guidance packs
- Matched by interpretation codes and answer conditions
- Displayed after worker completes and confirms assessment
- Acknowledged explicitly by the worker

## Guidance is not

- Diagnosis or prescription
- LLM-generated or chatbot output
- Automatic danger-sign prioritisation (Stage 9)
- Automatic referral creation (Stage 10)
- A substitute for clinician judgment

## Engine guarantees

`guidanceResolver.ts`:

- Returns `guidancePackUnavailable` when no loadable pack — **never invents fallback advice**
- Does not call external APIs or models
- Does not write to `risk_assessments` or `referrals`

## Synthetic development boundary

Development cards use explicit synthetic wording. Interpretation codes are `developmentCategoryA` / `developmentCategoryB` only — never clinical classification terms.

## Worker responsibilities

- Read development banners before sharing caregiver-facing text
- Do not treat synthetic cards as GHS-approved counselling
- Use manual clinical pathways outside the app when needed

## Related

- `docs/architecture/NUTRITION_GUIDANCE_RESOLUTION.md`
- `AGENTS.md` health and AI safety rules
