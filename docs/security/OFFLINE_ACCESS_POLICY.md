# Offline Access Policy

**Stage:** 5  
**Last updated:** 2026-08-02  
**Status:** Development-provisional values — production durations require approval

## Policy object

Typed in `apps/mobile/src/features/auth/domain/offlinePolicy.ts` as `OfflineAccessPolicy`.

## Development-provisional values (`version: 1`)

| Field | Value | Notes |
|---|---|---|
| `offlineUnlockAllowed` | `true` | Returning unlock permitted |
| `maxMsSinceRemoteVerification` | 14 days | Entitlement window |
| `maxFailedPinAttempts` | 5 | Then temporary lockout |
| `temporaryLockoutMs` | 30 seconds | Short for demo usability |
| `biometricsPermitted` | `true` | Optional setup |
| `administratorOfflineUnlockAllowed` | `true` | Unlock only — not org-wide offline admin work |
| `sessionInactivityTimeoutMs` | 15 minutes | Inactivity lock foundation |
| `label` | `development-provisional` | Must not be mistaken for production |

## Rules

- No local session ⇒ first sign-in requires remote verification (network)
- Expired entitlement ⇒ `sessionExpired`; remote sign-in required
- Indefinite offline access is not allowed
- PIN failures never auto-delete local records
- Administrator offline unlock does **not** imply offline organisation management or reporting

## Production

Final durations and administrator offline scope remain an explicit security decision. Do not silently ship provisional values as production policy.
