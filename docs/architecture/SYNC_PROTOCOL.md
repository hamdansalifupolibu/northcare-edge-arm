# Sync Protocol v1

Machine-readable contract: `implementation/sync-protocol-v1.json`.

## Summary

| Item | Value |
|---|---|
| Version | 1 |
| Transport | HTTPS JSON `/v1` |
| Authority | Server for shared records |
| Local-first | Offline clinical writes never require network |

## Endpoints

| Name | Method | Path |
|---|---|---|
| Live | GET | `/health/live` |
| Ready | GET | `/health/ready` |
| Dev token | POST | `/v1/development/auth/token` (development/test only) |
| Register device | POST | `/v1/devices/register` |
| Push | POST | `/v1/sync/push` |
| Pull | GET | `/v1/sync/changes` |
| Conflicts | GET | `/v1/sync/conflicts` |
| Resolve | POST | `/v1/sync/conflicts/{conflictId}/resolve` |

## Hard rules

- No mark-synced before ACK
- No pull-cursor advance before local apply
- No regenerating operation IDs on retry
- No blind LWW for clinical records
- No passwords/PINs/biometrics/raw QR/audio in ordinary sync payloads
- No full health payload logging

## Cursor

Opaque HMAC-signed, scope-bound position marker. Does not grant access by itself (Bearer still required). Codec encodes payload and signature as separate base64url parts so binary HMAC bytes cannot break the delimiter.
