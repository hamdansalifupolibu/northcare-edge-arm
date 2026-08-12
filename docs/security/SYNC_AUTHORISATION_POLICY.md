# Sync Authorisation Policy

## Identity

- Development/test: HS256 development JWT (`DEV_AUTH_SECRET`).
- Staging/production: Firebase verifier when configured; otherwise **fail closed** (`AUTH_UNAVAILABLE`).
- Development token route returns **404** outside development/test.

## Scope

- Organisation and facility are taken from the authenticated account, not client-escalated claims.
- Non-admin workers only pull/push within their facility.
- Unregistered / foreign devices → `DEVICE_NOT_REGISTERED`.
- Unknown or inactive accounts → `ACCOUNT_INACTIVE`.
- UUID guessing of conflict IDs yields **404**, not data.

## Client-supplied privileges

Role and organisation in client JSON are ignored for elevation. JWT development tokens do not embed client-supplied roles.
