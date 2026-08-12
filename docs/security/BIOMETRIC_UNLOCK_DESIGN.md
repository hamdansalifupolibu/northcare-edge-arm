# Biometric Unlock Design

**Stage:** 5  
**Last updated:** 2026-08-02  

## Package

`expo-local-authentication` ~57.0.2

## Role

Biometrics unlock a **local** authorised session. Success is **not** remote server authentication. PIN remains the mandatory fallback.

## Availability states

`available` | `notAvailable` | `notEnrolled` | `weakOnly` | `enabled` | `declined` | `failed` | `invalidated`

Setup is optional. Missing hardware/enrollment skips to setup-complete without blocking.

## Android preference

`authenticateAsync` uses `biometricsSecurityLevel: 'strong'` and `disableDeviceFallback: true` so device PIN/pattern is not treated as biometric success.

## Prompt behaviour

- At most one automatic prompt opportunity on returning unlock (UI provides an explicit fingerprint button for retry)
- Cancellation / failure returns to unlock UI — no prompt loops
- Repeated biometric failures do not bypass PIN attempt controls

## Invalidation

If biometric authentication reports unavailable after enablement:

1. Clear biometric session handle / enabled flag
2. Mark availability `invalidated`
3. Set `biometricEnabled: false` on the session envelope
4. Keep local session; fall back to PIN

NorthCare AI never receives or stores fingerprint images/templates.

## Validation status

| Check | Status |
|---|---|
| Unit tests with mocks/stubs | Pass |
| Emulator biometric UI | Pending (emulator offline) |
| Physical Samsung fingerprint | Pending |
| Biometric invalidation on new enrollment | Pending on device |
