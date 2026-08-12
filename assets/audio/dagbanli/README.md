# Dagbanli Audio Assets

**Status:** No final approved Dagbanli audio is currently supplied.

## Policy

- Do not fabricate Dagbanli medical translations.
- Do not generate synthetic final speech and present it as approved caregiver guidance.
- Every message must pass:
  1. Health-professional review
  2. Fluent Dagbanli-speaker review
  3. Recording + offline packaging

## Manifest fields

See `audio-manifest.json`. Each future entry should include:

- `message_id`
- `category`
- `english_text`
- `dagbanli_text`
- `health_review_status`
- `language_review_status`
- `speaker`
- `recording_status`
- `filename`
- `duration`
- `version`
- `offline_availability`
- `intended_screens`
- `created_at`
- `reviewed_at`

## Placeholder statuses

Use exactly:

- `REQUIRES HEALTH-PROFESSIONAL REVIEW`
- `REQUIRES FLUENT DAGBANLI-SPEAKER REVIEW`
- `RECORDING NOT YET AVAILABLE`

## Intended later use

Play reviewed clips from worker screens (nutrition guidance, caregiver counselling) with clear offline availability indicators.
