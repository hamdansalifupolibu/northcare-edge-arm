# Reach Stage R4 Checkpoint — Worker Community Requests Centre

**Stage:** Reach R4 — Worker Community Requests Centre  
**Status:** COMPLETE — READY FOR R5 APPROVAL  
**Date:** 2026-08-03  
**Scope approved:** Yes (explicit R4 implementation prompt)

## Checkpoint fields

| Field | Result |
|---|---|
| Stage | Reach R4 — Worker Community Requests Centre |
| Status | COMPLETE — READY FOR R5 APPROVAL |
| Stage 19 status | **Paused** until Reach R6 + manual validation |
| Environment preflight | Git status recorded; no Expo/RN upgrade; `NORTHCARE_REACH_DEMO_ENABLED` default false; Alembic head `0005`; OpenAPI **34** paths; R0 validate OK; live API process was not up during final walkthrough window (pytest covered journey) |
| Worker route | `/(worker)/community-requests` (`REACH-WRK-LIST-01`) |
| Request-detail route | `/(worker)/community-requests/[requestId]` (`REACH-WRK-DET-01`) |
| Worker workspace guard | Pass — `protected-worker` via `(worker)/_layout.tsx` |
| Administration denial | Pass — wrong-workspace → `/(admin)` |
| Admin-only denial | Pass — worker-role-required |
| Dual-role result | Pass — Worker workspace required |
| Feature entry point | Worker home **Community Requests** + truthful subtitle |
| API client | `createCommunityRequestsApiClient` — list/get/acknowledge/contact-attempt/handle |
| R2 API compatibility | Pass — no schema/enum/migration changes |
| Local storage decision | In-memory only; no SQLite request repository; no AsyncStorage contact cache |
| Offline mutation decision | Disabled — not queued; connectivity required messaging |
| Awaiting-review filter | Pass (`filter=awaiting`) |
| Assigned-to-me filter | Pass (`filter=assignedToMe`) |
| Emergency filter | Pass (`filter=emergency`) + emergency text label |
| Handled filter | Pass (`filter=handled`) |
| Loading state | Pass — “Checking for community requests…” |
| Empty states | Pass — filter-specific copy |
| Error state | Pass — mapped safe codes |
| Offline state | Pass |
| Reach-disabled state | Pass (`reachDemoDisabled`) |
| Manual refresh | Pass |
| Foreground refresh | Pass — AppState active while focused; in-flight guard |
| Request-card fields | Category, type, landmark, language, time, status, assigned-to-me; no contact number |
| List privacy result | Pass — contact omitted |
| Request-detail fields | Contact, consents, status, assignment, times, handledMeans, actions |
| Detail privacy result | Pass — no PIN / verifier |
| Acknowledge result | Pass — confirmation + `expectedVersion` |
| Unassigned claim result | Pass — UI allows acknowledge when `received` + unassigned; server authoritative |
| Concurrent acceptance result | Pass — `communityRequestAlreadyAssigned` → “no longer available” |
| Contact-attempt result | Pass |
| Handled result | Pass |
| Handled wording | Pass — not clinical care completion |
| Start-client-lookup result | Pass — navigates to `/(worker)/clients` only |
| Automatic client creation audit | Pass — none |
| Automatic client linking audit | Pass — none |
| Mutation versioning | Pass — `{ expectedVersion }` |
| Duplicate-tap result | Pass — `mutating` disables actions |
| Timeout result | Pass — `requestTimedOut`; no false success |
| Logging review | Pass — no contact/PIN/token logging added |
| Accessibility result | Pass — labels, selected filters, status text+chip, emergency text |
| Large-text result | Pass by design — font scaling enabled; wrapping layouts |
| Reduced-motion result | Pass — no flashing/pulsing emergency animation |
| Android runtime | Blocked — Windows path length (>260) under deep OneDrive path (known Stage 18 blocker) |
| Android walkthrough | **Not claimed** — blocker recorded; automated + API evidence preserved |
| Physical-device result | Pending |
| Simulator compatibility | Pass — R3 static simulator unchanged; pytest R3 + R4 journey |
| Public status compatibility | Pass — `publicStatusLabel` only |
| Remote notification implementation | **None** |
| Emergency escalation UI | **None** (deferred to R5) |
| Mobile migration | **None** |
| Backend migration | **None** |
| Packages installed | **None** |
| Reason for each package | N/A |
| Mobile type-check result | Pass (`npm run typecheck`) |
| Mobile lint result | Fail — **1** pre-existing error on `ClientRegisterScreen` react-hooks; **0** new R4 lint errors (2 unrelated client warnings) |
| Known pre-existing lint result | `ClientRegisterScreen.tsx` `react-hooks/preserve-manual-memoization` — **not introduced by R4** |
| Mobile test result | **396** passed / **90** suites |
| Reach R4 test result | **19** passed / **4** suites (`community-requests/__tests__`) |
| Expo Doctor result | **20/20** |
| Python type-check result | mypy pass (**60** source files) |
| Python lint result | ruff pass |
| Backend test result | **165** passed |
| API integration result | Pass (`test_reach_r4_worker_journey.py`) |
| OpenAPI result | Unchanged — **34** paths |
| R0 artifact-validation result | Pass |
| Known limitations | No offline mutation queue; no Call dialler action; no escalation UI; Android physical walkthrough pending; demo gate required |
| R5 implementation status | **Not started** |
| Stage 19 paused | **Yes** |
| Git status | No commit created (approval required) |
| Recommended R5 scope | Emergency coordination simulation — escalation UI, emergency prominence, truthful simulation walkthrough (no live telecom/ambulance) |
| Approval required | Yes — human approval before Reach **R5**. Do not start R5 or Stage 19 automatically |

### Do not print

- Password  
- Password verifier  
- Access token  
- Reset token  
- Status PIN  
- Status PIN verifier  
- Contact numbers  

## Files created

### Mobile feature

- `apps/mobile/src/features/community-requests/domain/types.ts`
- `apps/mobile/src/features/community-requests/domain/errors.ts`
- `apps/mobile/src/features/community-requests/domain/labels.ts`
- `apps/mobile/src/features/community-requests/domain/actions.ts`
- `apps/mobile/src/features/community-requests/transport/communityRequestsApiClient.ts`
- `apps/mobile/src/features/community-requests/application/createCommunityRequestServices.ts`
- `apps/mobile/src/features/community-requests/hooks/useCommunityRequestServices.ts`
- `apps/mobile/src/features/community-requests/components/CommunityRequestListItem.tsx`
- `apps/mobile/src/features/community-requests/components/CommunityRequestPrivacyNotice.tsx`
- `apps/mobile/src/features/community-requests/components/CommunityRequestStateViews.tsx`
- `apps/mobile/src/features/community-requests/screens/CommunityRequestsCentreScreen.tsx`
- `apps/mobile/src/features/community-requests/screens/CommunityRequestDetailScreen.tsx`
- `apps/mobile/src/features/community-requests/session/communityRequestViewStore.ts`
- `apps/mobile/src/features/community-requests/index.ts`
- `apps/mobile/src/features/community-requests/__tests__/routeGuards.test.ts`
- `apps/mobile/src/features/community-requests/__tests__/actionsAndLabels.test.ts`
- `apps/mobile/src/features/community-requests/__tests__/apiClient.test.ts`
- `apps/mobile/src/features/community-requests/__tests__/servicesWorkflow.test.ts`
- `apps/mobile/app/(worker)/community-requests/index.tsx`
- `apps/mobile/app/(worker)/community-requests/[requestId].tsx`

### Backend tests

- `services/api/tests/integration/test_reach_r4_worker_journey.py`

### Docs

- `docs/architecture/COMMUNITY_REQUEST_MOBILE_ARCHITECTURE.md`
- `docs/security/NORTHCARE_REACH_MOBILE_AUTHORISATION.md`
- `docs/design/NORTHCARE_REACH_WORKER_UI.md`
- `docs/accessibility/NORTHCARE_REACH_WORKER_ACCESSIBILITY.md`
- `docs/development/NORTHCARE_REACH_WORKER_RUNBOOK.md`
- `docs/testing/REACH_R4_TEST_STRATEGY.md`
- `docs/testing/REACH_R4_MANUAL_WALKTHROUGH.md`
- `docs/development/stages/REACH_R4_WORKER_REQUEST_CENTRE.md`
- `docs/development/REACH_R4_CHECKPOINT.md`

## Files modified

- `apps/mobile/app/(worker)/index.tsx`
- `apps/mobile/src/features/auth/providers/AuthSessionProvider.tsx`
- `apps/mobile/src/i18n/en.ts`
- `apps/mobile/README.md`
- `docs/architecture/NORTHCARE_REACH_ARCHITECTURE.md`
- `docs/architecture/COMMUNITY_REQUEST_DOMAIN_MODEL.md`
- `docs/security/NORTHCARE_REACH_PRIVACY_BOUNDARY.md`
- `docs/development/NORTHCARE_REACH_LOCAL_CONFIGURATION.md`
- `services/api/README.md`
- `README.md`
- `PROJECT_STATUS.md`
- `implementation/route-map.json`
- `implementation/screen-inventory.json`
- `implementation/component-inventory.json`
- `implementation/reach-roadmap.json`
- `implementation/implementation-roadmap.json`

## Commands run

```text
npm run typecheck          # apps/mobile — pass
npm run lint               # apps/mobile — pre-existing ClientRegisterScreen error only
npm test                   # apps/mobile — 396 passed / 90 suites
npm run doctor             # 20/20
python -m mypy src         # services/api — pass (60 files)
python -m ruff check src tests
python -m pytest -q        # 165 passed
python scripts/validate_reach_r0_artifacts.py  # pass
```

## Acceptance criteria summary

All R4 acceptance criteria in the stage prompt (routes, guards, filters, actions, privacy, no offline queue, no notifications, no escalation UI, quality gates, no commit, R5/Stage 19 not started) are met, with Android physical walkthrough explicitly pending due to the known path-length blocker.
