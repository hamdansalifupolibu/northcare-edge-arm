# Auth Development Provider

**Stage:** 5  
**Last updated:** 2026-08-02  

## Purpose

`DevelopmentAuthProvider` supplies synthetic accounts for local prototype and automated tests before Firebase (or another remote provider) is connected.

## Activation rules

- Constructed only when `appEnv` is not `production` (throws if production)
- Factory selects it for `development` / `test` only
- Staging/production use `UnavailableAuthProvider`

## Synthetic accounts (not real credentials)

| Identifier | Role | Notes |
|---|---|---|
| `dev-worker-001` | worker | Standard worker |
| `dev-worker-temp` | worker | Requires password change |
| `dev-admin-001` | administrator | Admin sign-in |
| `dev-worker-inactive` | worker | Inactive / rejected |

Passwords exist only in the development provider memory map for testing. They must not be logged or shown in production builds.

## Supported test scenarios

- Worker / administrator success
- Invalid credentials (generic)
- Role mismatch
- Inactive account
- Network unavailable (`simulateNetworkUnavailable`)
- Password-change required
- Password reset without enumeration

## Labelling

Any UI shortcut must be labelled **Development only** and excluded from production diagnostics.
