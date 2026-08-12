# Account Provisioning Workflow (Reach R1)

**Last updated:** 2026-08-03  
**Base saga:** `ADMINISTRATION_PROVISIONING_SAGA.md`

## Ordinary worker registration (R1)

Successful registration requires, in one controlled workflow:

1. Admin authentication and fresh token  
2. Email / facility validation (server organisation scope)  
3. Account row created (`pendingProvisioning` → `pendingFirstLogin`)  
4. Identity credential provisioned (development provider in local env)  
5. `worker` role assigned only  
6. **Professional profile created** (profession + community/emergency flags)  
7. Sanitised audit events written  
8. Idempotency key stored  

Client-supplied `role` / `organisationId` are ignored. Admin and dual-role assignment remain unavailable in ordinary registration.

## Professional profile update

Administrators may create or update a worker profile via:

`PATCH /v1/admin/accounts/{accountId}/professional-profile`

Optimistic concurrency uses `expectedProfileVersion` when a profile already exists. Stale updates are rejected and audited.

## Legacy accounts

Migration `0004` does **not** auto-create profiles. Workers without a profile show “Professional profile not configured” until an administrator adds one.

## Development demo profile

CLI (development only):

```text
python -m northcare_api.cli.set_development_professional_profile \
  --email hamdansalifupolibu@gmail.com \
  --profession communityHealthOfficer \
  --community-requests-enabled \
  --emergency-requests-enabled
```

Does not read or change passwords. See `docs/development/REACH_R1_DEMO_PROFILE_SETUP.md`.
