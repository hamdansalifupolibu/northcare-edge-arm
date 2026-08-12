# API Authorisation Matrix (Stage 18)

**Updated:** 2026-08-02  
Source of truth: FastAPI route dependencies + role assignments in PostgreSQL. Client-supplied roles/org/facility are **ignored** for authorisation.

| Endpoint group | Worker | Admin | Inactive | Revoked device | Unauthenticated | Notes |
|---|---|---|---|---|---|---|
| `GET /health` | yes | yes | yes | yes | yes | Public liveness |
| `POST /v1/development/auth/token` | env | env | no | no | env | Disabled in staging/production |
| `GET /v1/auth/session` | yes | yes | no | no | no | Token required |
| `POST /v1/devices/register` | yes | yes | no | no | no | Bound to account |
| Sync push/pull `/v1/sync/*` | yes | no* | no | no | no | Org/facility from token |
| Admin accounts `/v1/admin/accounts*` | no | yes | no | no | no | No clinical browse |
| Admin devices revoke | no | yes | no | no | no | Audit recorded |
| Admin history | no | yes | no | no | no | Metadata only |

\* Admin-only accounts lack worker clinical sync capability by design.

## Negative cases required

- Cross-organisation denial
- Cross-facility denial
- Worker denied `/v1/admin/*`
- Admin denied clinical sync without worker role
- Client role/org/facility fields ignored
- Last administrator protection on deactivate

Evidence: `services/api/tests/security/*`, `tests/integration/test_authz_api.py`, administration security tests.
