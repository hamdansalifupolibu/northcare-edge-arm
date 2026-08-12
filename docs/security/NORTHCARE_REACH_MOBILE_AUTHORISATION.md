# NorthCare Reach — Mobile Authorisation (R4 + R5)

**Last updated:** 2026-08-03  

## Requirements

Community Requests mobile routes require:

1. Authenticated remote session (Bearer access token)
2. Local unlock (`authState === 'authenticated'`)
3. Worker role among available roles
4. Active workspace `worker`

## Guards

`app/(worker)/_layout.tsx` applies `evaluateRouteAccess('protected-worker', …)`.

| Context | Result |
|---|---|
| Signed out | Redirect worker login |
| Locked | Redirect unlock |
| Admin-only account | Denied |
| Administration workspace | Redirect `/(admin)` |
| Dual-role in Worker workspace | Allowed |

## Server still authoritative

Even with a valid mobile session, the API enforces:

- Reach demo gate
- Worker role
- `communityRequestsEnabled`
- Facility / organisation scoping
- Emergency capability where required (`emergencyRequestsEnabled` for emergency category)
- Optimistic concurrency (`expectedVersion`)
- Escalation transition rules (`acknowledged` → `escalated`)

Mobile may hide escalate when clearly unavailable; denial still comes from the server.

## Privacy on device

- Contact numbers appear only on authorised detail
- Status PIN / verifier never displayed
- Detail cleared from memory on lock, logout, and workspace switch
- List cards omit contact numbers
- No logging of contact numbers, landmarks, tokens, PINs, or escalation bodies
- Emergency privacy reminder: use contact/landmark only to coordinate the request
