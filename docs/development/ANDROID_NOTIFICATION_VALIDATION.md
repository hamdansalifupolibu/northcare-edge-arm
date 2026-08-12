# Android notification validation (Stage 15)

## Runtime

| Item | Result |
|---|---|
| Preferred runtime | Expo Go SDK 57 **or** `npx expo run:android` / development build |
| Incompatible | Expo Go 51 (must not be used) |
| Config plugin | `expo-notifications` requires a rebuilt native application for channel/permission APIs |
| Walkthrough (section 80) | **Not completed in this environment** |
| Exact blocker | Interactive Android notification E2E was not executed after Stage 15 code landed; Metro was stopped for package install and a native rebuild + permission grant on emulator/device was not validated end-to-end. |
| Physical Samsung | Pending |

## What was verified in code/tests

- Generic title/body and safe payload unit tests
- Permission-denied keeps in-app reminder
- Scheduling failure preserves reminder
- Tap handling fails closed when locked / wrong role / invalid payload
- No exact-alarm permission added to app config
- Channel importance DEFAULT in scheduler implementation

## Re-run checklist

1. Ensure Expo Go 57 or a development build matching SDK 57
2. Start Postgres + FastAPI
3. Provision development worker via getpass CLI
4. Sign in, open Reminder Centre, create near-future reminder
5. Confirm generic lock-screen text and protected tap navigation
