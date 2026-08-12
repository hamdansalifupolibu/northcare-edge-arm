# Auth Error Disclosure Policy

**Stage:** 5  
**Last updated:** 2026-08-02  

## Principle

Authentication errors must not enable account enumeration or leak provider internals.

## Safe user-facing categories

Mapped by `apps/mobile/src/features/auth/services/errorMapper.ts`:

- `invalidCredentials`
- `networkUnavailable`
- `tooManyAttempts`
- `accountInactive`
- `passwordChangeRequired`
- `roleMismatch`
- `serviceUnavailable`
- `accessRevoked`
- `unknown`

## Forbidden disclosures

Do not show:

- Whether an email / worker ID exists
- “No user found” / “administrator account found”
- Firebase / provider internal error codes
- Stack traces or exception messages
- Account IDs in error text
- Raw security-policy internals (exact remaining attempts, KDF details)

## Password recovery

Always return the same generic confirmation:

> If the account can receive recovery instructions, they will be sent through the authorised recovery channel.

Plus administrator contact guidance when remote email recovery is unavailable.

## Logging

Log only sanitised error categories. Never log passwords, PINs, tokens, or full credentials.
