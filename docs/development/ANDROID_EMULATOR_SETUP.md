# Android Emulator Setup (Windows)

**Stage:** 2  
**Primary physical target:** Samsung Galaxy S20 Ultra  
**Early development target:** Android Studio Emulator  

An exact Samsung skin is **not** required. Prefer a modern Pixel (or similar) AVD with:

- Portrait orientation
- High-density display
- Modern Android system image
- Adequate RAM

## Observed local environment (2026-08-02)

| Check | Result |
|---|---|
| `adb` | Available (Android Debug Bridge 1.0.41) |
| `emulator` | Available under `%LOCALAPPDATA%\Android\Sdk\emulator` |
| Java | 21.0.9 LTS detected |
| Example AVD | `Medium_Phone_API_36.1` |
| `ANDROID_HOME` | May be mis-set to `...\cmdline-tools\latest\bin` — prefer SDK root |

Recommended environment variables:

```text
ANDROID_SDK_ROOT=C:\Users\<you>\AppData\Local\Android\Sdk
ANDROID_HOME=C:\Users\<you>\AppData\Local\Android\Sdk
```

Ensure `%ANDROID_SDK_ROOT%\platform-tools` and `%ANDROID_SDK_ROOT%\emulator` are on `PATH`.

## Setup steps

1. Install or open **Android Studio**.
2. Open **Device Manager**.
3. Create a modern Pixel (or similar) Android Virtual Device.
4. Select a **stable** Android system image (Google APIs recommended).
5. Enable hardware acceleration where supported (Windows Hypervisor Platform / HAXM as applicable).
6. Start the emulator from Device Manager or:

   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_36.1
   ```

7. Confirm the device is visible:

   ```powershell
   adb devices
   ```

   Expect a device line such as `emulator-5554   device`.

8. Start NorthCare AI from the repo root:

   ```powershell
   npm run mobile:android
   ```

   Or from `apps/mobile/`:

   ```powershell
   npm run android
   ```

9. Open / install the app on Android when Metro prompts.
10. Confirm the foundation screen shows **NorthCare AI** and the approved logo.

## Common troubleshooting

| Symptom | Likely fix |
|---|---|
| `adb devices` empty | Start/restart emulator; run `adb kill-server` then `adb start-server` |
| Metro cannot reach device | Ensure one device online; disable conflicting VPN; check firewall |
| SDK / cmdline tools errors | Set `ANDROID_HOME` / `ANDROID_SDK_ROOT` to the SDK root, not `cmdline-tools\...\bin` |
| Expo Go / package mismatch | Use Expo Go compatible with SDK 57, or reload with `npm run start:clear` |
| Emulator too slow | Enable hardware acceleration; reduce AVD resolution; close heavy apps |
| Wrong app identity | Confirm you launched `apps/mobile`, not an archived copy |

## Smoke-test expectations

- Metro starts
- App installs or opens on Android
- Name: NorthCare AI
- Foundation screen renders
- Logo renders
- No uncaught startup error
- Development error-boundary control can be verified
- Reload works
- App survives a normal restart

A web-browser run is **not** proof of Android success.

## Stage 2 smoke-test result (2026-08-02)

| Step | Result |
|---|---|
| AVD `Medium_Phone_API_36.1` started | Success |
| `adb devices` showed emulator online | Success |
| Corrected `ANDROID_HOME` / `ANDROID_SDK_ROOT` to SDK root for the session | Required |
| Metro started for `apps/mobile` | Success |
| Expo Go fetched/installed on emulator | Success |
| Android JS bundle completed (`index.ts`, 717 modules) | Success |
| Runtime logs: `Starting foundation checks` / `Foundation checks complete` | Success |
| Uncaught startup error | None observed |
| Manual visual confirmation of logo / “Verify error boundary” tap | Optional remaining human check on the open emulator |

**Note:** Persist `ANDROID_HOME` / `ANDROID_SDK_ROOT` to the SDK root (`...\Android\Sdk`), not `cmdline-tools\latest\bin`, so future launches do not fail with path errors.
