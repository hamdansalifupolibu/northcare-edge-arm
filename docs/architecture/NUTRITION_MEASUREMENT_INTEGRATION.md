# Nutrition Measurement Integration

**Stage:** 12  
**Date:** 2026-08-02

## Model

Measurements remain in the shared **`measurements`** table (Stage 6). Nutrition assessments link via **`nutrition_measurement_links`**.

| Column | Purpose |
|---|---|
| `nutrition_assessment_id` | Parent assessment |
| `measurement_id` | FK to `measurements.id` |
| `question_key` | Optional link to template question |
| `link_role` | Default `associated` |

## Capture path

1. Template questions with `answerType: 'measurement'` render via Stage 8 `QuestionField`.
2. `recordMeasurement` creates/updates `measurements` row and upserts link row.
3. Reference engine reads measurements by type through link resolution in services layer.

## Reference engine usage

`referenceEvaluator` expects:

- Required measurement types from reference pack
- Unit conversion via `risk/engine/unitConversion` (shared helper — not risk triggering)
- Supported units declared on pack (`kg`, `g`, …)

## Limitations (Stage 12)

- **No real anthropometry standards** — synthetic reference rules only match weight presence and dev answer patterns.
- No automated MUAC tape integration or device import.
- Missing measurements surface as `insufficientInformation` — not defaulted.

## Tests

`measurementIntegration.test.ts`

## Related

- `docs/architecture/NUTRITION_REFERENCE_ENGINE.md`
- Stage 6 `MeasurementRepository`
