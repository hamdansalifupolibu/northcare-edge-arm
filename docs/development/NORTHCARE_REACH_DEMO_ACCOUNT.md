# NorthCare Reach — Development Demo Account

**Environment:** development / hackathon demonstration only  
**Last updated:** 2026-08-03  
**Profile status:** Applied in Reach R1; eligible for R2 community-request routing  

## Account identity

| Field | Value |
|---|---|
| Email | `hamdansalifupolibu@gmail.com` |
| Account ID | `dev-dual-8d2ce4bbb8e656c8afea` |
| Roles | `worker`, `admin` |
| Facility | `fac-dev-001` |
| Organisation | `org-dev-001` |

This is the existing development dual-role account. See `docs/development/DEVELOPMENT_DUAL_ROLE_ACCESS.md`.

## Reach professional profile (R1 applied)

| Field | Value |
|---|---|
| Profession | `communityHealthOfficer` |
| Community requests enabled | `true` |
| Emergency requests enabled | `true` |

Profession must exist in `implementation/worker-profession-registry.json`.

Setup reference: `docs/development/REACH_R1_DEMO_PROFILE_SETUP.md`.

CLI (development only):

```bash
python -m northcare_api.cli.set_development_professional_profile
```

## Security rules

Do **not**:

- Hardcode the password  
- Change the password as part of Reach setup docs or the profile CLI  
- Add the password to documentation  
- Add the password to fixtures  
- Print the Argon2 verifier  
- Create another account using the same email  

Provision and rotate credentials only through the secure development CLI with hidden prompts. R1 profile application did **not** change the password.

## Demo role

This account is the demonstration responder for Community Requests and emergency acknowledgement. R2 can route synthetic requests to it when it is the deterministic match. Worker mobile Community Requests Centre remains R4. Admin workspace continues to manage ordinary worker registration (worker role only for new accounts).
