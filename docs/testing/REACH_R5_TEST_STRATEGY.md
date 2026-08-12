# Reach R5 — Test Strategy

**Last updated:** 2026-08-03  

## Mobile

| Suite | Focus |
|---|---|
| `actionsAndLabels.test.ts` | Escalate eligibility; emergency required/forbidden wording |
| `apiClient.test.ts` | `escalateCommunityRequest` + expectedVersion; offline; capability/transition errors |
| `servicesWorkflow.test.ts` | Ack → escalate → contact → handle versions; no false success |
| `routeGuards.test.ts` | Unchanged R4 workspace guards |

## Backend

| Suite | Focus |
|---|---|
| `test_reach_lifecycle.py` | Existing escalate capability + stale version |
| `test_reach_r5_emergency_journey.py` | Emergency create → ack → escalate → public status; denials; no auto-escalate |
| `test_reach_r4_worker_journey.py` | Routine R4 path regression |

## Safety assertions

Required phrases present; forbidden ambulance / severity / RED PRIORITY phrases absent from Reach emergency copy.

## Android

Prefer device walkthrough when path length allows; otherwise API + unit evidence with blocker recorded.
