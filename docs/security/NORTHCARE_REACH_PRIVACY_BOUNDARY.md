# NorthCare Reach — Privacy Boundary

**Status:** Frozen by Reach Stage R0; R2 implements gated public create/status and worker APIs; R3 adds browser simulator controls; R4 Worker mobile detail shows authorised contact only (no PIN; cleared on lock/logout/workspace switch); R5 adds emergency coordination reminder without copying or logging contact/landmark; R6 packages privacy E2E assertions and demo reset without printing contacts/PINs  
**Last updated:** 2026-08-03  

## Minimum collection (MVP)

Allowed:

- Request category  
- Request pathway (`requestType`)  
- Contact number  
- Community or landmark  
- Preferred language  
- Required consent flags  
- Status and assignment metadata  

Do **not** collect detailed symptoms in the MVP.

## Must not appear in these surfaces

Health details must not appear in:

- Reference code  
- Status PIN  
- Public status response  
- Notifications  
- Routes / URL query strings  
- Logs  
- Audit events (beyond necessary metadata)  
- Screenshots used for demos (use synthetic data; scrub if needed)  
- Browser `localStorage` / `sessionStorage` / cookies (R3 simulator)  

## Public status response

May return only generic states mapped from internal status (e.g. Request received, Waiting for review, Health worker acknowledged, Contact attempt recorded, Escalated for further support, Request handled, Request cancelled).

Must **not** expose: category, pregnancy/child/nutrition concern, emergency description, contact number, community, worker name, facility, clinical notes, priority, referral information.

## Status PIN

Returned once on create. Store only a secure verifier server-side. R3 may hold the PIN in memory for the current browser session only.

## R3 simulator

See `docs/security/NORTHCARE_REACH_SIMULATOR_SECURITY.md`.
