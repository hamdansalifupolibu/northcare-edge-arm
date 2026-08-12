# Android Runtime Recovery — Sync path

## Emulator online but app not at Sync Centre

1. Confirm `adb devices` shows `device` (not `offline`).
2. Confirm Metro on host port 8081.
3. Confirm API health: `http://127.0.0.1:8000/health/ready`.
4. From emulator, API base URL must be `http://10.0.2.2:8000` (not `localhost`).
5. Use Expo Go **SDK 57** for this project (`expo ~57.0.9`).
6. Complete onboarding → development identity → worker PIN before opening Sync Centre.
7. Do not rely on deep links into `/(worker)/sync-centre` while signed out.

## Common failures

| Symptom | Likely cause |
|---|---|
| Expo menu shows wrong SDK | Stale Expo Go APK |
| Onboarding only | Not authenticated |
| Sync fails immediately | Wrong API host / cleartext / API down |
| NetInfo connected but sync fails | Backend unreachable — expected; treat as sync failure, not “online success” |
