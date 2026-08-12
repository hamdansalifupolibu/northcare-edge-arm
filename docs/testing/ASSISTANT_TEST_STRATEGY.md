# Assistant Test Strategy

**Stage:** 13  
**Date:** 2026-08-02

## Location

`apps/mobile/src/features/assistant/__tests__/`

## Suites

| Suite | Focus |
|---|---|
| `contentGovernance.test.ts` | Pilot count zero; development load; production fail-closed |
| `retrieval.test.ts` | Index, ranking, coverage threshold behaviour |
| `answerComposition.test.ts` | Retrieval-only blocks; pack id/version; no invention |
| `safetyRouting.test.ts` | Diagnosis, treatment, urgent, patient-specific boundaries |
| `privacy.test.ts` | Conversation clear; logging hygiene |
| `feedback.test.ts` | Feedback/issue persistence + sync queue entity type |
| `routeSecurity.test.ts` | Protected-worker / locked / development gates |
| `a11yLabels.test.ts` | Accessibility strings; non-diagnostic searching copy |

## Patterns

- Synthetic fixtures only — pack `synthetic-dev-ask-northcare-v1`
- Shared `helpers.ts` for service/repo/manager setup
- Clear conversation store between tests
- Assert generative provider remains unavailable
- No real patient data

## Commands

```bash
npm run mobile:test -- --testPathPattern=assistant
npm run mobile:typecheck
```

## Manual / device

Android UI walkthrough — **pending** (`docs/development/ANDROID_ASSISTANT_VALIDATION.md`).

## Related

- `docs/safety/ASSISTANT_CLINICAL_SCOPE.md`
- `docs/development/ASSISTANT_DEVELOPMENT_CONTENT.md`
