# Backend Auth Boundary

**Stage:** 14

## Verifiers

| Verifier | Environments | Behaviour |
|---|---|---|
| `DevelopmentAccessTokenVerifier` | development, test | HS256 JWT via `POST /v1/development/auth/token` |
| `FirebaseAccessTokenVerifier` | staging/production when configured | Firebase Admin ID token verify |
| `UnavailableAccessTokenVerifier` | staging/production when Firebase unconfigured | Fail closed (`AUTH_UNAVAILABLE`) |

## Rules

- Map verified subject → provisioned `server_accounts` row
- Never trust client-supplied role/facility/organisation from sync payloads
- Development auth route returns 404 outside development/test
- Firebase production project creation is out of scope for Stage 14 (boundary only)
