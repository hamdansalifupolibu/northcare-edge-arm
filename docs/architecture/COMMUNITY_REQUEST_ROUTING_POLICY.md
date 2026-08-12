# Community Request — Routing Policy (R0 Freeze)

**Status (R2 implemented):** Frozen by Reach Stage R0  
**Last updated:** 2026-08-03  
**Machine-readable:** `implementation/community-request-routing-matrix.json`

## Principles

- Routing is **deterministic** (no AI, no workload balancing, no duty schedules).  
- Profession is separate from system role (`worker`).  
- Demo scope uses organisation `org-dev-001` and facility `fac-dev-001`.  
- Do not geocode communities, calculate districts, or search neighbouring facilities.  

## Eligibility requirements

A worker is eligible only if **all** apply:

- Active account  
- System role includes `worker`  
- Same demonstration organisation  
- Same demonstration facility  
- `communityRequestsEnabled = true`  
- For `category=emergency`: `emergencyRequestsEnabled = true`  

## Profession preference matrix

| Category | Preference order |
|---|---|
| `pregnancyNewborn` | midwife → communityHealthOfficer → communityHealthNurse |
| `childHealth` | communityHealthOfficer → communityHealthNurse → registeredGeneralNurse → physicianAssistant |
| `nutrition` | nutritionOfficer → communityHealthOfficer → communityHealthNurse |
| `generalChps` | communityHealthOfficer → communityHealthNurse → registeredGeneralNurse |
| `referralFollowUp` | previously assigned worker (if available) → communityHealthOfficer → communityHealthNurse |
| `emergency` | workers with `emergencyRequestsEnabled`; prefer `emergencyMedicalTechnician` when available; else `communityHealthOfficer` enabled for demonstration |

## Assignment behaviour

| Situation | Behaviour |
|---|---|
| Exactly one eligible worker | Assign to that worker; status → `assigned` |
| Multiple eligible workers | First deterministic match using documented stable ordering (profession preference, then stable account id ascending) |
| No eligible worker | Keep status `received`; place in authorised facility queue; do not discard; do not auto-assign unrelated profession |

Assignment does **not** prove the worker saw the request, contacted the user, resolved the request, or delivered care. The assigned worker must still **acknowledge**.

Prevent two workers from becoming responsible for the same request through concurrent acceptance (implementation in R2/R4).

## Out of scope for MVP routing

Catchment polygons · multiple facilities · worker ranking beyond matrix · shift scheduling · workload targets · AI matching.
