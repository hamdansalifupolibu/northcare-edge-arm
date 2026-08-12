# Nutrition Test Strategy

**Stage:** 12  
**Date:** 2026-08-02

## Location

`apps/mobile/src/features/nutrition/__tests__/`

## Suites (8 files / 20 tests)

| Suite | Focus |
|---|---|
| `contentGovernance.test.ts` | Pilot counts zero; dev load rules; production fail-closed |
| `assessmentWorkflow.test.ts` | Start, draft, answer, review, complete paths |
| `referenceEngine.test.ts` | Rule ordering, interpretation codes, missing info |
| `guidanceResolution.test.ts` | Card matching, unavailable pack, stable ordering |
| `completionRollback.test.ts` | **Mandatory** — transaction rollback on complete failure |
| `measurementIntegration.test.ts` | Measurement links + reference input |
| `securityPrivacy.test.ts` | No sensitive logging patterns |
| `a11yLabels.test.ts` | Key accessibility label constants |

## Patterns

- In-memory or test SQLite via shared helpers (`helpers.ts`)
- Synthetic fixtures only — no real patient data
- Repository-level integration where services touch persistence
- Rollback tests assert no partial reference/guidance rows after failure

## Commands

```bash
npm run mobile:test -- --testPathPattern=nutrition
npm run mobile:typecheck
```

## Results (Stage 12 gate)

| Check | Result |
|---|---|
| Nutrition suites | **8 suites / 20 tests pass** |
| Full repo suite | To be re-run by parent agent |
| Typecheck | Pass |

## Not covered (manual)

- Android emulator UI walkthrough — pending (`emulator-5554` offline)
- Physical device anthropometry entry
- Production build content gate smoke test on device

## Related

- `docs/safety/NUTRITION_CONTENT_GOVERNANCE.md`
- `docs/architecture/NUTRITION_DRAFT_LIFECYCLE.md`
