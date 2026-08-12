# Background Sync Decision

**Stage:** 14  
**Status:** Boundary only — background sync NOT claimed working

## Evaluation

Expo SDK 57 was reviewed for `expo-background-task` / background fetch style APIs for Android.

## Decision

- Implement a **BackgroundSyncScheduler** boundary interface on mobile.
- Keep registration **disabled** by default on Android until validated on target devices (including Samsung).
- Foreground + manual sync are the supported Stage 14 paths:
  - Sync now
  - App active
  - Offline → connected
  - Remote sign-in
  - Unlock interval (gated)
  - Debounced non-empty queue

## Honesty

Do **not** claim background sync works in demos, checkpoints, or UI copy. Sync Centre may state that background sync is not enabled in this build.
