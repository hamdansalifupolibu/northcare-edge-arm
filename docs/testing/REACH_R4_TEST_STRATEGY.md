# Reach R4 — Test Strategy

**Last updated:** 2026-08-03  

## Mobile (Jest)

| Suite | Focus |
|---|---|
| `community-requests/__tests__/routeGuards.test.ts` | Worker/admin workspace guards; view clear |
| `community-requests/__tests__/actionsAndLabels.test.ts` | Labels + action availability |
| `community-requests/__tests__/apiClient.test.ts` | Filters, versioning, offline, timeout, error codes |
| `community-requests/__tests__/servicesWorkflow.test.ts` | List privacy, acknowledge/contact/handle, no clinical side-effects |

## Backend (pytest)

| Suite | Focus |
|---|---|
| `tests/integration/test_reach_r4_worker_journey.py` | Create → list → detail → ack → contact → handle → public status; admin denial; wrong worker |
| Existing R2 lifecycle / authz / security suites | Preserved regression |

## Manual

See `REACH_R4_MANUAL_WALKTHROUGH.md`.

## Privacy in tests

Do not print passwords, tokens, status PINs, or contact numbers in reports.
