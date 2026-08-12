# Secure Session Storage

**Stage:** 5  
**Last updated:** 2026-08-02  

## Store

Expo SecureStore (`expo-secure-store` ~57.0.1) via `SecureSessionRepository`.

Keys (v1):

| Key | Content |
|---|---|
| `northcare.session.envelope.v1` | Versioned local session envelope JSON |
| `northcare.pin.verifier.v1` | scrypt verifier metadata (no raw PIN) |
| `northcare.biometric.enabled.v1` | `1` / `0` biometric preference flag |
| `northcare.pin.attempts.v1` | Failed attempt count + lockout timestamp |

## Session envelope fields

`schemaVersion`, `accountId`, `role`, `displayName`, `facilityId`, `facilityName`, `organisationId`, `lastRemoteVerificationAt`, `offlineAccessPolicyVersion`, `localSetupCompletedAt`, `biometricEnabled`, `sessionState`.

Validated on every load. Corrupt/invalid envelopes fail closed (removed; remote auth required).

## Must not store

- Raw password or raw PIN
- Full account profiles beyond envelope fields
- Patient / visit / screening / audio data
- Firebase service credentials
- Large JSON clinical records

SecureStore is **not** the source of truth for irreplaceable clinical records (those arrive in Stage 6+ SQLite).

## Test double

`MemorySecureSessionRepository` supports injectable clocks/tests and corrupt-session injection without SecureStore.

## Sign-out / change account

`clearAllAuthMaterial()` removes envelope, verifier, biometric flag, and attempt state. Future clinical record retention is documented as a later-stage policy — Stage 5 does not delete clinical data (none exists yet).
