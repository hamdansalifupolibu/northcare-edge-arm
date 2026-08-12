# Client Consent Foundation

**Stage:** 7  
**Status:** REQUIRES PROFESSIONAL LEGAL AND HEALTH-SERVICE REVIEW BEFORE PILOT DEPLOYMENT  

## Scope

Stage 7 records a consent **status** during client registration. It does **not** invent a definitive legal consent form.

## Statuses

| Status | Meaning |
|---|---|
| `unknown` | Not yet determined |
| `recorded` | Consent was recorded |
| `declined` | Consent declined |
| `deferred` | Consent deferred |
| `notApplicable` | Not applicable for this registration |

## Rules

- Never default consent to `recorded`.
- Do not hide consent inside a general terms checkbox.
- When status becomes `recorded`, store `consent_recorded_at`.
- Worker account is captured via audit / `created_by_account_id`.

## Review required

Final wording, retention, and health-service policy must be reviewed by authorised professionals before pilot deployment.
