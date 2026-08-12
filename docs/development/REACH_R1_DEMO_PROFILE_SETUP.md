# Reach R1 — Demo Professional Profile Setup

**Environment:** development / hackathon demonstration only  
**Last updated:** 2026-08-03  
**Status:** Applied in R1  

## Target account

| Field | Value |
|---|---|
| Email | `hamdansalifupolibu@gmail.com` |
| Account ID | `dev-dual-8d2ce4bbb8e656c8afea` |
| Roles | `worker`, `admin` |
| Facility | `fac-dev-001` |
| Organisation | `org-dev-001` |

## Profile applied

| Field | Value |
|---|---|
| Profession | `communityHealthOfficer` |
| Community requests enabled | `true` |
| Emergency requests enabled | `true` |

Password was **not** changed. Do not document, print, or commit the password or verifier.

## CLI (development only)

```bash
python -m northcare_api.cli.set_development_professional_profile \
  --email hamdansalifupolibu@gmail.com \
  --profession communityHealthOfficer \
  --community-requests-enabled \
  --emergency-requests-enabled
```

Rules:

- Runs only in development; refuses staging/production  
- Requires an existing account with worker role  
- Creates or updates the professional profile  
- Prints a safe summary only  
- Creates a sanitised audit event  
- Must not request or alter the password  

## Verification (safe)

Confirm via admin account details or admin APIs that:

- Account ID, roles, facility, and organisation are unchanged  
- Profession is `communityHealthOfficer`  
- Both enablement flags are `true`  
- No password-change flow was triggered by this CLI  

See also: `docs/development/NORTHCARE_REACH_DEMO_ACCOUNT.md`, `docs/development/DEVELOPMENT_DUAL_ROLE_ACCESS.md`.
