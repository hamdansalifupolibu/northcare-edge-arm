# Android Sync Validation — Stage 14 close-out

**Date:** 2026-08-02  
**Decision:** Interactive Sync Centre E2E **not passed** — exact blocker below.

## ADB state

```text
adb devices -l
emulator-5554          device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64 device:emu64xa
```

`sys.boot_completed=1`. Expo Go present: `host.exp.exponent`.

## What succeeded

| Step | Result |
|---|---|
| Start portable PostgreSQL | Running (16.2) |
| Start FastAPI | `/health/live` + `/health/ready` OK |
| Start Metro (`npx expo start --android`) | Bundled `expo-router/entry.js` (2312 modules) |
| Local DB on device | `schemaVersion: 8`, migrations applied |
| Screenshot evidence | App reached onboarding (not Sync Centre) |

## Exact Android Sync Centre blocker

| Field | Detail |
|---|---|
| Command | `npx expo start --port 8081 --android` then `adb shell am start -a android.intent.action.VIEW -d "exp://192.168.1.103:8081/--/%28worker%29/sync-centre"` |
| Observed | Bundle OK → onboarding (“Built for frontline health workers”). Deep link does **not** land on authenticated Sync Centre. Expo Go developer menu previously reported **SDK 51.0.0** while `apps/mobile` uses **Expo ~57.0.9**. |
| Suspected layer | Auth/onboarding gate + Expo Go SDK mismatch / deep-link into protected `(worker)` group |
| Attempted correction | Encoded deep link; dismiss Expo menu; re-bundle (schema v8 confirmed) |
| Next manual action | Install Expo Go matching SDK 57; complete development sign-in + PIN on emulator; open Sync Centre from worker home; run Sync now against `10.0.2.2:8000` (or LAN IP) |

Do **not** claim Android Sync Centre E2E passed.

## Screenshots

- `docs/development/_sync_centre_attempt.png` — Expo menu / route explorer
- `docs/development/_sync_centre_after_back.png` — onboarding page 2
