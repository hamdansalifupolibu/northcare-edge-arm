# Stage 10 Checkpoint Report

**Stage:** 10 — Referrals and QR Referral Passport  
**Status:** COMPLETE — READY FOR STAGE 11 APPROVAL  
**Date:** 2026-08-02  

## Environment preflight

| Check | Result |
|---|---|
| Metro :8081 | Free |
| Package manager | npm |
| `@tybys/wasm-util` | Not present |
| React tree | `react@19.2.3`, `react-native@0.86.2`, `react-dom` not installed |
| Typecheck (pre) | Pass |
| Tests (pre) | 40 suites / 188 tests pass |
| Expo Doctor (pre) | 20/20 |

## Dependency-health result

Updated `docs/development/DEPENDENCY_HEALTH.md`.

| Package | Version | Reason |
|---|---|---|
| `expo-camera` | 57.0.3 | SDK 57 barcode scan via `CameraView` |
| `react-native-qrcode-svg` | 6.3.21 | Offline QR render on existing `react-native-svg` |

Install used `--legacy-peer-deps`. No Expo/React/RN upgrade. Metro was not running during install. Reused `expo-crypto` + `@noble/hashes`.

## Existing referral persistence audit

Stage 6 `referrals` / `referral_events` reused and extended. Migration **004** adds workflow columns + `referral_passports` (token_hash, status, expires_at, indexes). Screens never execute SQL or manipulate sync-queue directly.

## Referral workflow

| Field | Value |
|---|---|
| Feature root | `apps/mobile/src/features/referrals/` |
| Origins | `priorityAssessment`, `workerInitiated`, `visitFollowUp` |
| Priority policy | Preserve engine priority; worker-initiated → `undetermined` / `noEnginePriority` |
| Reference code | `NCR-XXXXXXXX` provisional |
| Drafts | SQLite only |
| Source facility/worker | Auth session only |
| Caregiver informed | Does not default to informed |
| Status transitions | Validated; append-only events; scan does not mutate status |

## QR Referral Passport

| Field | Value |
|---|---|
| URI | `northcare://referral-passport/v1/{opaqueToken}` |
| Entropy | expo-crypto ~128-bit; URL-safe |
| Persistence | SHA-256 `token_hash` only |
| Resolve | Local hash lookup only |
| Unknown device | “not available on this device” |
| Claims avoided | encrypted / signed / blockchain / synced / facility notified |

## Content gate

| Field | Value |
|---|---|
| Approved pilot reasons | **0** |
| Development reasons | 3 synthetic (`APPROVED_FOR_DEVELOPMENT`) |
| Production behaviour | Fail closed — no synthetic reasons load |

## Commands (post)

| Check | Result |
|---|---|
| Typecheck | Pass |
| Lint | Pass (0 errors after referral lint fixes) |
| Tests | **47 suites / 212 tests** pass |
| Expo Doctor | **20/20** |
| adb | `emulator-5554` **offline** — see `ANDROID_REFERRAL_VALIDATION.md` |

## Packages installed

- `expo-camera@57.0.3`
- `react-native-qrcode-svg@6.3.21`

## Known limitations

- No pilot clinical referral reasons  
- Android / physical QR + camera validation pending  
- Cross-device passport resolution not available (documented)  
- Trusted referral exchange deferred  
- Passport expiry provisional (30 days)  
- Manual entry requires high-entropy token (honest entropy limitation)  
- Performance timings remain non-device Jest baselines  

## Recommended Stage 11 scope

Voice-to-care capture and structured extraction — **do not start without approval**.

## Git status

No commit created (awaiting approval).

## Approval required

STAGE 10 COMPLETE — READY FOR STAGE 11 APPROVAL
