# Android Stage 18 Validation Walkthrough

**Updated:** 2026-08-02

## Runtime matrix

| Runtime | Status |
|---|---|
| Expo Go 57.0.2 on `emulator-5554` | Available (Stage 17 validated path) |
| Development build `com.northcareai.app` | **Not installed** — build attempted; see `ANDROID_DEVELOPMENT_BUILD.md` |
| Expo Go 51 | Not used |

## Hardening walkthrough honesty

Because the native development build did not complete install, the full Stage 18 native walkthrough (notifications channel, camera QR, SecureStore production path, TalkBack on native package) is **not fully tested**.

### Completed / partially completed

| Item | Status |
|---|---|
| Emulator attached | Pass |
| TalkBack package present + service enable via adb | Attempted |
| Automated a11y/security tests | Pass (341 mobile with `--runInBand`) |
| Expo Go UI sampling (prior Stage 17) | Pass for entry/workspace/password |
| Native notification icon confirmation | Blocked on dev build |
| Physical device security validation | **Not tested** |

## Physical device

No physical Samsung/device lab pass was completed in Stage 18. Recorded as **not tested** (not passed).

## Recommended Stage 19 follow-up

1. Shorten workspace path if CMake path limits persist  
2. Correct persistent user `ANDROID_HOME` to SDK root  
3. Retry `npx expo run:android` on unloaded machine  
4. Execute full walkthrough checklist on `com.northcareai.app`  
5. Physical-device TalkBack + biometric + notification shade review  
