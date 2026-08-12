# Stage 17 — Android visual walkthrough

**Date:** 2026-08-02  

## Runtime

| Item | Result |
|---|---|
| Emulator | `emulator-5554` attached |
| Android version | 16 |
| Expo Go | `host.exp.exponent` **57.0.2** (SDK 57) |
| Expo Go 51 | Not used |
| Development build (`com.northcareai.app`) | Not installed |
| Metro | Bundled successfully on port 8081 |

## Preferred path used

Expo Go **SDK 57** on the attached emulator.

## Walkthrough evidence (synthetic UI only — no passwords captured)

| Step | Result |
|---|---|
| Cold launch after Expo Go notification gate | App loads (no uncaught `expo-notifications` crash) |
| Worker entry | “Frontline Health Worker”, Continue / Change workspace |
| Workspace selection | “Choose your workspace”; worker/admin cards; Continue disabled until select; no placeholder icon captions |
| Worker login | Password field `password=true` (hidden); control `Show password` / label “Show” present |
| Local DB | Metro log: schemaVersion 9 ready |

## Honest blockers / limits

1. **Native notification icon** — wired in `app.config.ts` + asset; Expo Go may still show Expo’s default status icon. Confirm on `npx expo run:android` / development build.
2. **Device notification scheduling in Expo Go** — fail-closed via `createLocalNotificationScheduler()` when `Constants.appOwnership === 'expo'` (SDK 53+ removed push/notification native path from Expo Go). Reminder records remain available in-app; scheduling requires a development build.
3. **Physical Samsung** validation (battery / reboot / notification delivery) not run in this session.
4. Screenshots of password fields were **not** archived (privacy).

## Conclusion

Stage 17 Android visual path is **validated on Expo Go 57** for entry, workspace selection, and password show/hide. Native notification scheduling/icon confirmation remains a development-build follow-up (documented; Stage 18 not started).
