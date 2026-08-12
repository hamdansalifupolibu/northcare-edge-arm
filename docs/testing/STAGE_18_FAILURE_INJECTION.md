# Stage 18 — Failure Injection

**Updated:** 2026-08-02

## Scenarios

| Scenario | Expected | Evidence |
|---|---|---|
| Network unavailable at sign-in | Calm offline/auth error; no crash | developmentAuth / offlinePolicy tests |
| Sync push failure | Dirty records retained | sync engine / conflict tests |
| Conflict on pull | Conflict review records; no silent discard | syncConflictPersistence |
| Notification module unavailable (Expo Go) | Scheduler fail-closed; reminders records preserved | expoGoNotificationGate |
| Render exception | AppErrorBoundary calm UI; no stack to users in production | AppErrorBoundary tests |
| Invalid QR payload | Parser rejection; no clinical write | qrPassportParser / referralSecurity |
| Low storage | Exact behaviour not fully instrumented on device | **Documented gap** — Stage 19 device lab |
| Process restart | Local SQLite persistence expected | migration + repository tests; device confirmation pending |

## Low-storage honesty

No automated low-storage emulator injection was completed. Status: **not tested** (not passed).
