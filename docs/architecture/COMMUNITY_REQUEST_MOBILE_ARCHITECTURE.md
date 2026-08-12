# Community Request — Mobile Architecture (R4 + R5)

**Status:** Implemented through Reach R5  
**Last updated:** 2026-08-03  

## Purpose

Worker Community Requests Centre consumes existing R2 Worker APIs. The mobile app does **not** duplicate routing, status engines, or profession matching.

## Feature location

```text
apps/mobile/src/features/community-requests/
  domain/          types, labels, actions, emergencyPresentation, errors
  transport/       communityRequestsApiClient (Bearer + NetInfo + timeout)
  application/     createCommunityRequestServices
  hooks/           useCommunityRequestServices
  components/      list item, privacy notice, emergency banner, state views
  screens/         centre + detail
  session/         ephemeral clear on lock/logout/workspace switch
  __tests__/
```

Expo Router wrappers:

- `apps/mobile/app/(worker)/community-requests/index.tsx`
- `apps/mobile/app/(worker)/community-requests/[requestId].tsx`

## API operations

| Client method | HTTP |
|---|---|
| `listCommunityRequests` | `GET /v1/worker/community-requests?filter=` |
| `getCommunityRequest` | `GET /v1/worker/community-requests/{id}` |
| `acknowledgeCommunityRequest` | `POST .../acknowledge` `{ expectedVersion }` |
| `escalateCommunityRequest` | `POST .../escalate` `{ expectedVersion }` |
| `recordCommunityContactAttempt` | `POST .../contact-attempt` |
| `markCommunityRequestHandled` | `POST .../handle` |

Escalation body is version-only — no ambulance, severity, diagnosis, or destination fields.

## Escalation eligibility (UI helper)

Mirrors R2: `assignedToCaller` and status `acknowledged`. Server remains authoritative. Escalate is **not** driven by category alone.

## Local storage decision (intentional)

- No SQLite community-request / emergency repository
- No offline escalation queue
- No AsyncStorage of contact numbers or emergency badges
- In-memory list/detail only; cleared on lock, logout, workspace switch
- Offline mutations are disabled (not queued)

## Refresh

Manual, focus, and foreground AppState refresh only. No background polling, WebSockets, or push.
