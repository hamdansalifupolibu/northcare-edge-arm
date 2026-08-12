# Android Auth Validation

**Stage:** 5  
**Last updated:** 2026-08-02  

## adb status

```text
List of devices attached
emulator-5554	offline
```

**Result:** Android emulator validation **blocked** — device listed but offline. Stage 5 does **not** claim Android walkthrough pass.

## Automated checks completed

- TypeScript typecheck
- ESLint
- Jest unit/integration tests (auth domain, PIN, session, biometrics mocks, routes, security)
- Expo Doctor (run at checkpoint)

## Manual walkthrough (when emulator/device is online)

Run from `apps/mobile/`:

```bash
adb devices
npm run android
```

Then exercise:

1. Workspace selection → Worker
2. Worker login — invalid credentials (generic error)
3. Synthetic development login (`dev-worker-001`)
4. First-time password change (use `dev-worker-temp` path)
5. Facility confirmation
6. PIN create + confirm
7. Biometric availability result (enable or skip)
8. Setup complete → worker shell
9. Manual lock → PIN unlock
10. Incorrect PIN → lockout behaviour
11. Logout / change account
12. Administrator login + role mismatch (admin creds on worker screen)
13. Password recovery (generic confirmation)
14. App restart → returning unlock
15. Airplane mode unlock (authorised local session)

## Physical device still required for

- Samsung fingerprint prompt behaviour
- SecureStore hardware-backed behaviour
- Biometric invalidation after new enrollment
- App background → inactivity lock
- Real device restart persistence
- PIN KDF performance on low-end Android

## Blocker

Cold-boot or repair `emulator-5554` (or connect a physical device) before claiming Stage 5 Android visual/security validation complete.
