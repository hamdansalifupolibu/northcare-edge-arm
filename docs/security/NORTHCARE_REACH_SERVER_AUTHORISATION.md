# NorthCare Reach — Server Authorisation (R2)

## Public

Create and status endpoints require the Reach development gate. They do not accept organisation, facility, worker, status, or version from the caller.

## Worker

Worker Community Request APIs require:

- Authenticated bearer token  
- Active account with **worker** role  
- Matching organisation and facility  
- Professional profile with `communityRequestsEnabled`  
- For emergency category: `emergencyRequestsEnabled`  

Admin-only accounts are denied. Dual-role accounts are eligible only via the worker role and profile.

## Visibility

- Assigned-to-caller requests  
- Unassigned facility-queue requests (`received`) the caller is professionally eligible to claim  

Cross-organisation and cross-facility access is denied. List responses omit contact numbers; detail may include contact for authorised workers only. PIN verifier and lockout fields are never returned.
