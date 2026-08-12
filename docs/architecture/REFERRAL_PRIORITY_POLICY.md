# Referral Priority Policy

**Stage:** 10  
**Status:** Provisional for development

## Rules

1. When origin is `priorityAssessment`, referral priority **must** come from the linked saved risk assessment. Do not invent or casually downgrade it.
2. Worker-initiated referrals without a linked assessment use priority `undetermined` and `prioritySource = noEnginePriority`.
3. If a worker-initiated referral later links an assessment, preserve the engine priority (`preservedEngine`) — do not silently change it to a softer colour.
4. Screens and forms must not accept a free-form priority override that contradicts the linked assessment.

## Honesty

`undetermined` means “no engine priority attached,” not a clinical green clearance.
