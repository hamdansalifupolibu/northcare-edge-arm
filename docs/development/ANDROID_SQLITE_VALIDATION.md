# Android SQLite Validation

**Stage:** 6  
**Last updated:** 2026-08-02  
**Status:** BLOCKED — emulator offline  

## adb status

```text
adb devices
emulator-5554	offline
```

## Manual validation checklist (when emulator/device is available)

1. App starts
2. Database opens
3. Migrations apply
4. App restart does not incorrectly re-run completed migrations
5. Open `/(development)/database-preview`
6. Seed synthetic data
7. Confirm synthetic counts display (aggregates only)
8. Repository self-check passes
9. Reset requires confirmation
10. Reset reapplies migrations
11. Logs contain no health details / PIN / tokens
12. Authentication still works after DB init
13. Lock/unlock does not corrupt database access

## Commands

```bash
adb devices
cd apps/mobile
npm run android
# In development build, navigate to database-preview
```

## Performance

Do not treat Node/Jest timings as Android performance approval.
