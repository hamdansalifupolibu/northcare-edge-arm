# Nutrition Follow-Up Policy

**Stage:** 12  
**Date:** 2026-08-02

## Field

`nutrition_assessments.follow_up_source`:

| Value | Meaning |
|---|---|
| `notSet` | No follow-up date chosen |
| `workerSelected` | Worker set date manually |
| `guidanceSuggested` | Date suggested from guidance card metadata (future pilot) |
| `requiresReview` | Placeholder when policy unclear |

Optional `follow_up_date` on assessment row (legacy-compatible).

## Stage 12 behaviour

- Workers may record a follow-up date at completion — **local SQLite only**
- **No notification scheduling** — Stage 14+ concern
- Guidance cards may include worker action text mentioning follow-up — does not auto-create tasks

## No automatic escalation

Follow-up recording does **not**:

- Trigger Stage 9 risk re-evaluation
- Create Stage 10 referrals
- Send push notifications (not implemented)

## Privacy

Follow-up dates are sensitive health metadata — same classification as other assessment fields. Not logged in diagnostics.

## Future

Pilot guidance packs may define suggested intervals — still require worker confirmation before persisting `guidanceSuggested`.
