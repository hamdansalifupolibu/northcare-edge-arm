# Nutrition Draft Lifecycle

**Stage:** 12  
**Date:** 2026-08-02

## States

Assessment `status` on `nutrition_assessments`:

| Status | Meaning |
|---|---|
| `draft` | In progress; answers may be partial |
| `completed` | Worker confirmed; reference + guidance persisted |
| `cancelled` | Discarded draft |

## Flow

```text
startAssessment → draft (one draft per client enforced)
  → recordAnswer / recordMeasurement (section progress saved)
  → reviewAssessment (completeness check)
  → completeAssessment (confirmed=true → completed + engines run)
  → guidance screen → acknowledgeGuidance
```

## Draft rules

- `findDraftByClient` returns existing draft — `startAssessment` may return `existingDraft`.
- `discardDraft` soft-deletes draft with reason.
- `progress_section_id` tracks last active section for resume routing.

## Review gate

`reviewAssessment` uses `evaluateNutritionCompleteness` — missing required answers block completion with explicit missing-information list.

## Completion transaction

`completeAssessment` runs in a transaction:

1. Persist final answers
2. Evaluate and store reference result
3. Resolve and store guidance resolution
4. Mark assessment completed with `confirmed_by_account_id` / `confirmed_at`
5. Roll back entire transaction on failure (see `completionRollback.test.ts`)

## Correction

`correctAssessment` supersedes a completed assessment — creates new draft lineage without mutating historical answers in place.

## Follow-up

`follow_up_source` records whether follow-up date was worker-selected or guidance-suggested — does not schedule notifications in Stage 12.

See `docs/safety/NUTRITION_FOLLOW_UP_POLICY.md`.
