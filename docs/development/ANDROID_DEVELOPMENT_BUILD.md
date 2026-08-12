# Android Development Build (Stage 18)

**Updated:** 2026-08-02  
**Goal:** Native development build for `com.northcareai.app` (not Expo Go 51).

## Attempted path

```bash
cd apps/mobile
# Fix incorrect ANDROID_HOME if it points at cmdline-tools\...\bin
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
npx expo run:android --no-bundler
```

## What succeeded

| Step | Result |
|---|---|
| Expo prebuild | Created local `apps/mobile/android/` (gitignored) |
| `package.json` scripts | Added `android` / `ios` / `web` run scripts |
| Gradle download | Gradle 9.3.1 downloaded |
| Partial compile | Many tasks completed (resources, some native modules) |
| TalkBack package on emulator | `com.google.android.marvin.talkback` present; service enable attempted |

## Exact blockers observed

### 1) First attempt — wrong `ANDROID_HOME`

- Environment had `ANDROID_HOME=...\Android\Sdk\cmdline-tools\latest\bin`
- Symptom: `Error: The system cannot find the path specified` immediately after prebuild
- Fix for session: point `ANDROID_HOME` / `ANDROID_SDK_ROOT` at `%LOCALAPPDATA%\Android\Sdk` and write `android/local.properties` `sdk.dir`

### 2) Second attempt — Gradle worker daemon timeout under load

- Command: `gradlew.bat app:assembleDebug ... -PreactNativeArchitectures=x86_64`
- Failure task: `:react-native-safe-area-context:compileDebugJavaWithJavac`
- Gradle message: unable to connect to Gradle Worker Daemon after 120s; “build machine is extremely loaded”
- Concurrent Jest suite was running on the same machine during that attempt

### 3) Path-length warning (residual risk)

- CMake warned object paths under `...\Hon. Salifu Dandaawa\NorthCare AI Project\apps\mobile\node_modules\expo-modules-core\...` approach Windows 250-character limits
- May require shorter checkout path for reliable native builds

### 4) Third attempt — CMake / path-length failure

- Failure task: `:app:buildCMakeDebug[x86_64]`
- Workspace path includes spaces and is deep under OneDrive (`Hon. Salifu Dandaawa\NorthCare AI Project\...`)
- Earlier CMake warnings already noted object paths approaching Windows 250-character limits under `node_modules/expo-modules-core`

## Status label

**ATTEMPTED — NOT YET SUCCESSFUL** for installing `com.northcareai.app` on the emulator.

Exact residual blockers to clear in Stage 19 (or ops):

1. Set persistent `ANDROID_HOME` / `ANDROID_SDK_ROOT` to `%LOCALAPPDATA%\Android\Sdk` (not `cmdline-tools\...\bin`)
2. Retry on an unloaded machine (avoid concurrent heavy Jest/Gradle)
3. Prefer a shorter non-spaced checkout path for native CMake builds

Expo Go **57** remains the validated runtime for UI sampling; native notification icon / camera / SecureStore production-path confirmation still needs a successful development build.

## Packages

No new runtime npm packages were added for the build attempt. `android/` remains gitignored.
