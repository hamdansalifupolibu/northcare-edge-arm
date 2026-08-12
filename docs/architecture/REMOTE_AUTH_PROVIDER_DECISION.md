# Remote Auth Provider Decision

**Stage:** 5  
**Last updated:** 2026-08-02  
**Status:** Firebase deferred — fail closed in production/staging

## Inspection result

No intentional Firebase public mobile configuration is present in this repository stage. Therefore Stage 5 does **not** claim Firebase Authentication is connected.

## Decision

| Build env | Selected provider | Behaviour |
|---|---|---|
| `development` / `test` | `DevelopmentAuthProvider` | Synthetic accounts for prototype and automated tests |
| `staging` | `UnavailableAuthProvider` | Fail closed (`serviceUnavailable`) |
| `production` | `UnavailableAuthProvider` | Fail closed; never demo auth |

Factory: `apps/mobile/src/features/auth/services/createRemoteAuthProvider.ts`

## Interface

`RemoteAuthProvider` supports:

- `signIn` / `signOut`
- `changePassword`
- `requestPasswordReset` (generic response only)
- `getCurrentAccount`
- `refreshAccountStatus`
- `getPasswordPolicy`

UI must not import Firebase. Raw provider exceptions must not reach presentation components.

## Firebase (future)

When all of the following are true, implement `FirebaseAuthProvider` behind the same interface:

- Firebase project intentionally configured
- Public mobile config available via approved env module (`EXPO_PUBLIC_FIREBASE_*`)
- Email/password (or approved method) enabled
- Package verified for Expo SDK 57
- Decision documented and tested

Do not add Admin SDK, service-account keys, or private secrets to the mobile app.

## Production rule

Never silently fall back to development/demo authentication in production or staging.
