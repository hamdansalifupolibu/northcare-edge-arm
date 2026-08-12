# Authentication Architecture — NorthCare AI

**Stage:** 5 — Authentication and Secure Local Access  
**Last updated:** 2026-08-02  
**Status:** Implemented (Firebase remote provider deferred)

## Core distinction

| Concern | Responsibility |
|---|---|
| **Remote authentication** | Verifies an administrator-provisioned worker/admin account against a remote auth provider |
| **Local device unlock** | Unlocks an already authorised local session with PIN or biometrics while offline |

A local PIN is **not** a substitute for remote account authentication. First successful login on a device requires remote verification.

## No public registration

Accounts are created only through an authorised administrative process. The app must not provide:

- Sign-up / create-account UI
- Anonymous accounts
- Self-service role selection after login
- Worker→administrator elevation
- Facility self-assignment

## Domain model

Located under `apps/mobile/src/features/auth/domain/`:

- `AuthRole`: `worker` | `administrator`
- `AuthSessionState`: preparing → signedOut / firstTimeSetupRequired / locked / authenticated / sessionExpired / accessRevoked / error
- `AuthAccount`: identity, role, facility, organisation, status flags (no clinical fields)
- `LocalSessionEnvelope`: versioned SecureStore session metadata
- `OfflineAccessPolicy`: versioned provisional policy (see security docs)

## Layers

```text
UI routes (app/(auth)/, worker/admin shells)
  → AuthSessionProvider (session orchestration)
    → RemoteAuthProvider (factory)
    → SecureSessionRepository (SecureStore / memory for tests)
    → PinVerifier (scrypt via @noble/hashes)
    → BiometricService (expo-local-authentication)
```

UI screens never call Firebase (or any remote SDK) directly. Provider errors are mapped through `errorMapper` to safe message keys.

## Provider factory

`createRemoteAuthProvider()`:

| Environment | Provider |
|---|---|
| `development` / `test` | `DevelopmentAuthProvider` (synthetic accounts) |
| `staging` / `production` (no Firebase config) | `UnavailableAuthProvider` (fail closed) |
| Future (Firebase provisioned) | `FirebaseAuthProvider` behind the same interface |

Production must never select `DevelopmentAuthProvider`.

## First-time online flow

1. Workspace selection (preference only — not authoritative role)
2. Worker or administrator login (`loginIdentifier` + password)
3. Remote sign-in (network required when no local session)
4. Optional temporary password change
5. Assigned facility confirmation
6. Six-digit PIN create + confirm
7. Optional biometric enable
8. Local session envelope + PIN verifier stored in SecureStore
9. Protected shell entry

Role mismatch (workspace vs account role) is rejected with a clear message — no silent role switch.

## Returning offline unlock

When a valid local session exists within offline entitlement:

1. Cold start hydrates envelope → `locked`
2. Unlock with PIN (or biometric if enabled)
3. Failed PIN attempts counted; temporary lockout after threshold
4. Manual lock / inactivity lock return to unlock
5. Sign out / change account clears local auth material

## Route protection

`evaluateRouteAccess` enforces:

- Public entry + auth login/recovery
- `auth-setup` only during first-time setup
- `auth-locked` for unlock / session-expired surfaces
- `protected-worker` / `protected-admin` with role + authenticated state
- Development routes blocked when diagnostics are off

## Integration with launch

`LaunchProvider` continues to own onboarding/workspace preference.  
`AuthSessionProvider` owns authentication and unlock. Root layout nests Auth inside Launch.

## Related docs

- `AUTH_IDENTIFIER_DECISION.md`
- `REMOTE_AUTH_PROVIDER_DECISION.md`
- `docs/security/PIN_SECURITY_DESIGN.md`
- `docs/security/SECURE_SESSION_STORAGE.md`
- `docs/security/BIOMETRIC_UNLOCK_DESIGN.md`
- `docs/security/OFFLINE_ACCESS_POLICY.md`
- `docs/security/AUTH_ERROR_DISCLOSURE_POLICY.md`
