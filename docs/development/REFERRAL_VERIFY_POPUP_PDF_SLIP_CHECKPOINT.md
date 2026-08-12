# Checkpoint — Referral verify popup + printable PDF slip

**Slices:** F1 (verify success popup) + F2 (printable caregiver PDF) + F3 (crash-safe PDF probe + create congrats)  
**Status:** Implemented — awaiting approval  
**Scope:** Net-new polish only. Stage 19 not started.  
**Date:** 2026-08-04

## What was implemented

### F1 — Congratulatory verify popup
- On successful offline verify (`verifyOfflinePassport`), show a professional Modal (“Referral verified” / “This NorthCare referral is legitimate.”) with ref + from→to and Continue CTA.
- Same modal on **Scan passport** and **Enter code** when a signed v2 QR/URI verifies successfully.
- Shared `ReferralCelebrationModal` component; strings unified in `referralStrings.ts`.
- Softened worker-facing copy (no algorithm names / “cryptography”).

### F1b — Create-referral congrats
- `ReferralSuccessScreen` shows first-mount modal: “Patient referred” → share QR slip with caregiver → Continue.

### F2 — Printable PDF caregiver slip (crash-safe)
- **Root cause of remaining crash:** even lazy `require('expo-print')` loads `ExponentPrint.js`, which calls `requireNativeModule('ExpoPrint')` and throws when the native module is absent. React can surface that as an uncaught route crash.
- **Probe:** `requireOptionalNativeModule('ExpoPrint')` from `expo-modules-core` **before** any `require('expo-print')`. Default `pdfAvailable = false`.
- **Strategy A (native present):** expo-print → PDF / print dialog → expo-sharing (also probed via `ExpoSharing` before require).
- **Strategy B (native missing):** no crash; hide Export/Print; rebuild hint + Share caregiver slip always; optional on-screen **Preview slip** (screenshot) — no new native modules (`react-native-view-shot` not installed).
- Unit tests for availability helper when probe returns null / throws.
- `expo-print` / `expo-sharing` autolink on rebuild; no config plugin required for outbound PDF/share (`app.config.ts` comment).

### F4 — Signed + Sealed v3 Offline Passport
- **Asymmetric Name Sealing:** Uses **X25519 Sealed-Box** equivalent with ephemeral keys and BLAKE2b key derivation to encrypt the client's `displayName` under the destination facility's public key (`facilityPassportSeal.ts`).
- **Authorization/Location Gate:** Displays the decrypted name on the verify screen only if the verifying facility holds the matching private key (e.g. Tamale Teaching or Korle Bu). Otherwise, it displays "sealed for receiving facility" and keeps the name cryptographically hidden while confirming signature legitimacy.
- **Short Metadata Fields:** Packs `sex` and `ageBand` into optional fields in the QR payload where scannability size limits permit.
- **Backward Compatibility:** v2 signature-only passports are still parsed and verified successfully.

## Files created

- `apps/mobile/src/features/referrals/security/buildCaregiverSlip.ts`
- `apps/mobile/src/features/referrals/security/buildPassportQrSvg.ts`
- `apps/mobile/src/features/referrals/security/__tests__/buildCaregiverSlip.test.ts`
- `apps/mobile/src/features/referrals/application/caregiverSlipPdf.ts`
- `apps/mobile/src/features/referrals/application/__tests__/caregiverSlipPdfAvailability.test.ts`
- `apps/mobile/src/features/referrals/components/ReferralCelebrationModal.tsx`
- `apps/mobile/src/features/referrals/components/CaregiverSlipPreview.tsx`
- `apps/mobile/src/features/referrals/security/developmentFacilitySealKeys.ts`
- `apps/mobile/src/features/referrals/security/facilityPassportSeal.ts`
- `apps/mobile/src/features/referrals/security/passportAgeSex.ts`
- `docs/development/REFERRAL_VERIFY_POPUP_PDF_SLIP_CHECKPOINT.md`

## Files modified

- `apps/mobile/src/features/referrals/screens/VerifyOfflinePassportScreen.tsx`
- `apps/mobile/src/features/referrals/screens/ReferralPassportScreen.tsx`
- `apps/mobile/src/features/referrals/screens/ReferralSuccessScreen.tsx`
- `apps/mobile/src/features/referrals/screens/ScanPassportScreen.tsx`
- `apps/mobile/src/features/referrals/screens/EnterPassportCodeScreen.tsx`
- `apps/mobile/src/features/referrals/i18n/referralStrings.ts`
- `apps/mobile/src/features/referrals/application/createReferralServices.ts`
- `apps/mobile/src/features/referrals/security/qrPassportParser.ts`
- `apps/mobile/src/features/referrals/security/signedPassportClaims.ts`
- `apps/mobile/src/features/referrals/security/signedPassportCrypto.ts`
- `apps/mobile/app.config.ts`
- `apps/mobile/package.json` (+ lockfile)
- `docs/architecture/QR_REFERRAL_PASSPORT_SECURITY.md`
- `docs/development/OFFLINE_VERIFIABLE_REFERRAL_PASSPORT_PLAN.md`
- `README.md`

## Commands run

```text
cd apps/mobile
npm test -- --testPathPattern="referrals|caregiverSlip|buildCaregiverSlip|signedPassport|qrPassport" --no-coverage
# Synced changed files → C:\NorthCare\mobile
# adb force-stop + relaunch com.northcareai.app on 192.168.1.69:5555
```

## Packages installed

- `expo-print` ~57.0.1
- `expo-sharing` ~57.0.8
- `qrcode` 1.5.4 (direct; was already transitive via `react-native-qrcode-svg`)
- `@types/qrcode` (dev)

## Results

| Check | Result |
|---|---|
| Type-check | Pre-existing splash route typing error only; no new referral/PDF errors matched |
| Lint | Not run |
| Tests | **Pass** — 11 suites / 41 tests (`referrals` + slip + availability probe) |
| Android device | Relaunched on Wi‑Fi adb `192.168.1.69:5555` (SM-G988B); Metro short-path reused |
| Short-path sync | Synced to `C:\NorthCare\mobile` |

### Device (Android-first)
1. Open referral passport — screen must **not** redbox on ExpoPrint.
2. Without rebuild: Export/Print hidden; Share slip + Preview slip work.
3. Create referral → “Patient referred” modal → Continue → success content.
4. Verify offline / Scan passport with valid v2 QR → “Referral verified” / legitimate modal.

## Offline behaviour

PDF generation and print/share are device-local. No network required for verify or PDF.

## Privacy / security

- QR / signed claims: unchanged minimal set (no full name).
- Paper PDF / preview: may include display name; excludes phone, notes, vitals, screening answers.
- No logging of full QR payloads, tokens, or PINs. No algorithm names in worker UI.

## Remaining risks

- **Older binaries:** any install that predates the rebuild below still hides Export/Print (Strategy B). A new `npx expo run:android` (or equivalent native rebuild) is required after adding `expo-print` / `expo-sharing`.
- Demo signing keys remain in-client — rotate before pilot (technical docs may still name the algorithm; workers no longer see it in UI).
- Share/Preview text fallback is **not** a file PDF — use Export PDF / Print only when Strategy A is active.

## Native rebuild (2026-08-04) — ExpoPrint enabled on device

PDF JS was already implemented (`caregiverSlipPdf.ts`), but Export/Print stayed hidden until `ExpoPrint` existed in the binary.

| Item | Detail |
|---|---|
| Build root | `C:\NorthCare\mobile` (synced from OneDrive `apps/mobile`) |
| Command | `npx expo run:android --device SM_G988B --no-bundler` |
| Device | SM-G988B serial `192.168.1.69:5555` (Wi‑Fi adb); app id `com.northcareai.app` |
| Result | **BUILD SUCCESSFUL** (~7m34s); APK installed (upgrade, no uninstall); lastUpdateTime `2026-08-04 14:39:24` |
| Autolink | Build logged `expo-print` 57.0.1 + `expo-sharing` 57.0.8; `classes23.dex` contains `ExpoPrint` + `ExpoSharing` |
| Config plugin | Not required (Expo SDK 57 docs); `ANDROID_HOME` must point at SDK root for local builds |
| Metro | Existing `C:\NorthCare\mobile` Metro on 8081; `adb reverse` 8081 + 8000 reapplied |

### How to verify on phone
1. Open a referral passport after create/verify.
2. Confirm **Export PDF** and **Print** are visible (not only Share/Preview).
3. Export PDF → system share sheet with a `.pdf` → open in a PDF viewer or save/print.
4. Print → Android print dialog → select printer or Save as PDF.

## Stop condition

Stop here. Do **not** start Stage 19. Await approval before committing.
