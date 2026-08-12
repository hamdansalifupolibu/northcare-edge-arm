# Android build — Samsung Galaxy S20 Ultra (SM-G988B)

**Updated:** 2026-08-09  
**App id:** `com.northcareai.app`  
**Expo SDK:** 57  
**Purpose:** Install a **native development build** on your physical phone (not Expo Go). Required for PDF export (`expo-print`), notifications, and other native modules.

---

## Why we use a short path

The OneDrive checkout path is long and can break Gradle/CMake on Windows:

```text
C:\Users\Gebruiker\OneDrive\Desktop\Hon. Salifu Dandaawa\NorthCare AI Project\apps\mobile
```

**Build from the short copy instead:**

```text
C:\NorthCare\mobile
```

Sync code from OneDrive → `C:\NorthCare\mobile` before building (robocopy, manual copy, or your usual sync). Do **not** commit secrets (`.env` stays local).

---

## One-time setup

### 1. Android SDK

`ANDROID_HOME` must point at the **SDK root**, not `cmdline-tools\...\bin`:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
```

Install via Android Studio: SDK Platform (API 34+), Build-Tools, Platform-Tools.

### 2. Phone — developer options

On the S20 Ultra:

1. **Settings → About phone → Software information** → tap **Build number** 7 times  
2. **Settings → Developer options** → enable **USB debugging**  
3. For Wi‑Fi adb (recommended): enable **Wireless debugging** and pair from PC when needed  

### 3. Dependencies (short path)

```powershell
cd C:\NorthCare\mobile
npm install
```

---

## Connect the phone (Wi‑Fi adb — preferred)

USB can be flaky on this device. Wi‑Fi adb has worked reliably.

```powershell
adb devices -l
```

If the phone is not listed, pair wireless debugging (port changes each session):

```powershell
adb pair 192.168.1.69:PORT
adb connect 192.168.1.69:PORT
adb devices -l
```

You should see something like `192.168.1.69:5555 device` and model `SM_G988B`.

**Use the device model name with Expo**, not always the IP:port (Expo’s device parser can trip on IP:port):

```powershell
npx expo run:android --device SM_G988B
```

---

## Full native build + install (first time or after new native modules)

From `C:\NorthCare\mobile`:

```powershell
cd C:\NorthCare\mobile

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

npx expo run:android --device SM_G988B
```

- First build can take **~7–15 minutes** (Gradle download + compile).  
- Installs/upgrades `com.northcareai.app` on the phone.  
- Rebuild when you add native packages (e.g. `expo-print`, `expo-notifications`).

**Optional:** if Metro is already running elsewhere, skip bundler during build:

```powershell
npx expo run:android --device SM_G988B --no-bundler
```

---

## Daily dev — Metro + reload (no full rebuild)

After a native build is installed, JS/TS changes usually only need Metro:

**Terminal 1 — Metro**

```powershell
cd C:\NorthCare\mobile
npx expo start --port 8081 --clear
```

**Terminal 2 — adb reverse (phone must be connected)**

```powershell
adb -s 192.168.1.69:5555 reverse tcp:8081 tcp:8081
adb -s 192.168.1.69:5555 reverse tcp:8000 tcp:8000
```

(Replace IP:port with your current `adb devices` entry.)

**Relaunch app**

```powershell
adb -s 192.168.1.69:5555 shell am force-stop com.northcareai.app
adb -s 192.168.1.69:5555 shell monkey -p com.northcareai.app -c android.intent.category.LAUNCHER 1
```

Or shake the phone → **Reload** in the dev menu.

---

## When you need a rebuild vs reload

| Change | Action |
|---|---|
| TypeScript / React screens only | Metro reload |
| New npm package with **native code** | `npx expo run:android --device SM_G988B` |
| `app.config.ts` plugins / permissions | Rebuild |
| Stuck on splash / “Cannot find native module …” | Rebuild |

---

## Verify the build

1. App opens without red screen  
2. Dev auth bypass (if enabled): splash → workspace → worker  
3. Referral passport: **Export PDF** / **Print** visible (needs native rebuild with `expo-print`)  
4. Local API (optional): `adb reverse tcp:8000 tcp:8000` and run `services/api` on PC  

USSD uses **Render** (`northcare-api.onrender.com`) — the phone app is not required for AT simulator demos.

---

## Syncing code from OneDrive → short path (important)

**Do NOT robocopy `node_modules` from OneDrive.** The monorepo root `package.json` (`name: "northcare-ai-project"`) causes npm to create a symlink `node_modules/northcare-ai-project → project root`. This creates an **infinite recursion** when robocopy tries to follow it with `/MIR`, copying the entire project tree endlessly.

### Correct 3-step procedure

**Step 1 — Sync source only** (exclude `node_modules` and build artifacts):

```powershell
robocopy "c:\Users\Gebruiker\OneDrive\Desktop\Hon. Salifu Dandaawa\NorthCare AI Project\apps\mobile" "C:\NorthCare\mobile" /MIR /FFT /R:1 /W:1 /XD node_modules .expo android\build android\.gradle android\.cxx android\app\build
```

This takes ~3 seconds.

**Step 2 — Fresh npm install** in the short path:

```powershell
cd C:\NorthCare\mobile
npm install
```

This takes ~5 minutes and installs all dependencies correctly, including native modules like `react-native-worklets`, `whisper.rn`, and `llama.rn`.

**Step 3 — Build and deploy**:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

npx expo run:android --device SM_G988B
```

### What NOT to do

| ❌ Don't | Why |
|---|---|
| `robocopy ... node_modules /MIR` | Infinite symlink recursion — runs forever |
| `npm install --legacy-peer-deps` in short path | Can remove `react-native-worklets` and break Gradle |
| Copy `node_modules` then run `npm install` on top | Leaves stale/broken symlinks |

### When to re-sync

- After adding/removing npm packages in the OneDrive workspace
- After significant source code changes
- After pulling from Git

You do **not** need to re-sync for JS/TS-only changes if Metro is already running — just reload.

---

## Stuck loading screen — recovery procedure (2026-08-07)

If the app opens but stays on the splash/loading screen after code changes (common after Dagbanli/i18n work or Metro cache issues):

### Quick fix (try first)

1. Shake the phone → **Reload** in the dev menu  
2. Or force-stop and relaunch:

```powershell
adb -s R5CN404ZDHK reverse tcp:8081 tcp:8081
adb -s R5CN404ZDHK shell am force-stop com.northcareai.app
adb -s R5CN404ZDHK shell am start -n com.northcareai.app/.MainActivity
```

### Full recovery (when reload does not help)

**Step 1 — Sync source from OneDrive to short path** (exclude `node_modules`):

```powershell
robocopy "C:\Users\Gebruiker\OneDrive\Desktop\Hon. Salifu Dandaawa\NorthCare AI Project\apps\mobile\src" "C:\NorthCare\mobile\src" /E /XO /NFL /NDL /NJH /NJS /NC /NS
robocopy "C:\Users\Gebruiker\OneDrive\Desktop\Hon. Salifu Dandaawa\NorthCare AI Project\apps\mobile\app" "C:\NorthCare\mobile\app" /E /XO /NFL /NDL /NJH /NJS /NC /NS
```

**Step 2 — Kill anything on port 8081 and restart Metro with cache clear:**

```powershell
# Find and kill process on 8081 if needed
netstat -ano | Select-String ":8081.*LISTENING"
# taskkill /F /PID <pid>

cd C:\NorthCare\mobile
npx expo start --port 8081 --clear
```

Wait for `Waiting on http://localhost:8081`.

**Step 3 — Set ANDROID_HOME correctly** (must be SDK root, not `cmdline-tools\...\bin`):

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
```

**Step 4 — Full native rebuild + install** (when Metro alone is not enough):

```powershell
cd C:\NorthCare\mobile\android
.\gradlew.bat assembleDebug

adb -s R5CN404ZDHK install -r C:\NorthCare\mobile\android\app\build\outputs\apk\debug\app-debug.apk
adb -s R5CN404ZDHK reverse tcp:8081 tcp:8081
adb -s R5CN404ZDHK shell am start -n com.northcareai.app/.MainActivity
```

First Gradle build after cache clear: **~13 minutes**. APK install over USB can take **2–4 minutes** (large native libs).

**Step 5 — Verify in Metro logs:**

```text
Android Bundled … node_modules\expo-router\entry.js
INFO  Development auth bypass active — remote login skipped, direct to worker workspace
INFO  Local database ready {"schemaVersion":9,"migrationsApplied":0}
```

INFO  Local database ready {"schemaVersion":10,"migrationsApplied":1}
```

---

## Emulator — stuck on “Loading from…” / white startup screen (2026-08-09)

Applies to **Android emulator** (`emulator-5554`, API 36) and dev client (`com.northcareai.app`) when Metro is on the host PC. Same symptoms can appear on a physical device if the JS bundle never finishes downloading.

### Symptom

- App shows native **“Loading from 10.0.2.2:8081…”** (emulator) or a **white startup screen with logo + spinner** that never clears.
- Metro may log `Android Bundled …` on the host, but **no** `ReactNativeJS` lines in logcat (auth bypass / database ready never appear).
- Can persist for minutes even after Metro reports a successful bundle.

### Root cause (confirmed via logcat)

The dev client fails while downloading the JS bundle from Metro:

```text
okhttp.OkHttpClient: Callback failure for call to http://10.0.2.2:8081/...
java.net.ProtocolException: Expected leading [0-9a-fA-F] character but was 0xd
  at com.facebook.react.devsupport.BundleDownloader.processMultipartResponse
```

Metro serves large bundles (~15 MB) as **`multipart/mixed` + `Transfer-Encoding: chunked`**. React Native 0.86’s Android `BundleDownloader` mis-parses that stream, so **JavaScript never loads** — the app never reaches React bootstrap (auth, database, navigation).

This is **not** the same as a slow database or auth hydrate; those only matter **after** the bundle loads.

### Fix in repo (permanent)

1. **Metro patch** — `apps/mobile/patches/metro+0.84.4.patch`  
   Disables multipart bundle responses; Metro serves plain `application/javascript` with `Content-Length` instead. Applied automatically via `patch-package` on `npm install`.

2. **Bootstrap hardening** (when JS does load but demo bypass felt slow):
   - `app/index.tsx` / `app/(entry)/splash.tsx` — dev bypass no longer waits for full launch/database pipeline.
   - `AuthSessionProvider.tsx` — one-shot hydrate via `useLayoutEffect` (no fragile `setTimeout(0)` loop).
   - `app/_layout.tsx` — hide native splash once fonts are ready.

After `npm install`, confirm the patch exists: `apps/mobile/patches/metro+0.84.4.patch`.

### Recovery procedure (emulator)

**Terminal 1 — Metro** (avoid `--clear` unless you must; first full bundle can take ~50 s):

```powershell
cd C:\NorthCare\mobile   # or apps\mobile in OneDrive checkout

$env:EXPO_PUBLIC_APP_ENV = "development"
$env:EXPO_PUBLIC_DEV_AUTH_BYPASS = "true"
$env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:5001/northcare-ai/us-central1/api"

npx expo start --dev-client --port 8081
```

Wait for `Waiting on http://localhost:8081`.

**Terminal 2 — adb reverse + launch**

```powershell
adb -s emulator-5554 reverse tcp:8081 tcp:8081

# Optional: pre-warm bundle on host so emulator hits a cached response
curl.exe -s -o NUL "http://127.0.0.1:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable"

adb -s emulator-5554 shell am force-stop com.northcareai.app
adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "northcare://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.northcareai.app
```

Use **`localhost:8081`** in the deep link when `adb reverse` is set. For emulator without reverse, use `10.0.2.2:8081`.

**Verify Metro patch is active** (host):

```powershell
curl.exe -s -D - -H "Accept: multipart/mixed" -o NUL "http://127.0.0.1:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true" | Select-String "Content-Type"
```

Expected: `Content-Type: application/javascript` — **not** `multipart/mixed`.

**Verify success in logcat:**

```powershell
adb -s emulator-5554 logcat -d -t 200 ReactNativeJS:* *:S
```

Expected:

```text
Development auth bypass active — remote login skipped, direct to worker workspace
Local database ready {"schemaVersion":12,...}
```

Must **not** see `ProtocolException` / `processMultipartResponse`.

### If it happens again

| Check | Action |
|---|---|
| `ProtocolException` in logcat | Re-run `npm install` in `apps/mobile` to re-apply `patches/metro+0.84.4.patch`; restart Metro |
| Port 8081 in use | Kill old Metro: `Get-NetTCPConnection -LocalPort 8081 \| …` → stop owning PID |
| Launched before Metro finished bundling | Wait for first `Android Bundled … (3078 modules)` then reload app |
| Patch missing after sync to `C:\NorthCare\mobile` | Copy `patches/` folder and run `npm install` in short path |
| Still stuck after bundle loads | Shake → Reload; check Metro for red-screen / bundling errors (syntax, bad imports) |

### S20 Ultra note

Same Metro patch and adb-reverse flow apply on the physical device. Use `adb -s SM_G988B reverse tcp:8081 tcp:8081` (or your current wireless adb serial) and open the app via the dev client launcher with `http://localhost:8081`.

---

## Issues encountered during hackathon sprint (2026-08-07 — 2026-08-08)

Real problems hit on the S20 Ultra during demo prep. Documented here so the next build does not repeat them.

### 1. Black screen after bundle loads

| | |
|---|---|
| **Symptom** | App opens, Metro bundles, then blank/black screen — no worker home |
| **Cause** | Broken i18n migration syntax in multiple files (e.g. `const t = useTranslation();{` inside function params; module-level `referralStrings` without hook) |
| **Fix** | Repair syntax in affected screens/components; use `useNutritionStrings()` / `useTranslation()` **inside** components only; restart Metro with `--clear` |
| **Files (examples)** | `LoginScreen.tsx`, `QuestionField.tsx`, `CreateReferralScreen.tsx`, referral state views |

### 2. `Property 'nutritionStrings' doesn't exist` (Nutrition history crash)

| | |
|---|---|
| **Symptom** | Red screen when opening Nutrition landing/history |
| **Cause** | `NutritionHistoryItem.tsx` called `nutritionStrings` in a **module-level** helper `syncLabel()` — outside the React component where the hook runs |
| **Fix** | Pass strings into `syncLabel(status, strings)` from the component |

### 3. Empty on-device AI model folders

| | |
|---|---|
| **Symptom** | Voice-to-Care / Ask NorthCare report models missing |
| **Cause** | Fresh install — `files/whisper/` and `files/offline-ai-models/` empty on phone |
| **Fix** | Copy from PC cache (`C:\NorthCare\model-cache`): `ggml-base.en.bin` (~148 MB), `qwen2.5-0.5b-instruct-q4_k_m.gguf` (~491 MB); `adb push` then `adb shell run-as com.northcareai.app cp ...` into app files dir |

### 4. Wireless adb connection

| | |
|---|---|
| **Symptom** | USB adb flaky or slow |
| **Working setup** | `adb connect 192.168.1.69:38019` (port changes when re-pairing wireless debugging) |
| **After connect** | `adb reverse tcp:8081 tcp:8081` before launching app |

### 5. Metro port conflicts

| | |
|---|---|
| **Symptom** | `Port 8081 is being used`; or app stuck loading because Metro died during Gradle build |
| **Fix** | `netstat -ano \| Select-String ":8081.*LISTENING"` → kill PID → `npx expo start --port 8081 --clear` from `C:\NorthCare\mobile` |

### 6. Schema migration v10 (nutrition growth z-scores)

| | |
|---|---|
| **Symptom** | New nutrition growth panel not persisting after assessment complete |
| **Cause** | Migration `010_nutrition_growth_indicators` adds `growth_indicators_json` column |
| **Verify** | Metro log: `Local database ready {"schemaVersion":10,...}` |
| **Fix** | Reinstall app or let migration run on next launch; do not skip rebuild if DB schema changed mid-demo |

### 7. Nutrition z-scores “not visible” during form fill

| | |
|---|---|
| **Symptom** | Worker expects z-scores while entering measurements |
| **Expected behaviour** | Z-scores calculate on **assessment complete** — shown on **summary** and **details** screens (not on the section form) |
| **Requires** | Sex + weight + height/length recorded before completion |

### 8. Quick sync for JS-only fixes (no full rebuild)

```powershell
robocopy "...\NorthCare AI Project\apps\mobile\src\features\nutrition" "C:\NorthCare\mobile\src\features\nutrition" /MIR /NFL /NDL /NJH /NJS /nc /njs /np
adb -s 192.168.1.69:38019 shell am force-stop com.northcareai.app
adb -s 192.168.1.69:38019 shell monkey -p com.northcareai.app -c android.intent.category.LAUNCHER 1
```

Then shake → **Reload** if Metro already running.

### Root causes seen on S20 Ultra

| Cause | What happened | Fix |
|---|---|---|
| Metro died during Gradle build | Gradle or a prior process took port 8081; Metro exited with code 1 | Restart Metro after build completes |
| Wrong `ANDROID_HOME` | `expo run:android` fails with “The system cannot find the path specified” | Point at `$env:LOCALAPPDATA\Android\Sdk` |
| Stale Metro bundle | UI changes not visible | `--clear` + reload, or full rebuild |
| i18n hook misuse | Black screen / `nutritionStrings` / `referralStrings` ReferenceError | Hooks only inside components; pass strings to helpers |
| KeyStore hang | Splash never clears | 3-second SecureStore timeout guard; shake → Reload |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Error: The system cannot find the path specified` right after prebuild | Fix `ANDROID_HOME` → SDK root |
| Gradle timeout / daemon | Close heavy apps; don’t run Jest + Gradle together |
| CMake / path too long | Build only from `C:\NorthCare\mobile` |
| Metro stuck loading / Frozen on loading screen | See **Emulator — stuck on “Loading from…”** section above for `ProtocolException` / multipart bundle fix. Otherwise: KeyStore 3 s timeout; `adb reverse tcp:8081 tcp:8081`; open dev client with `http://localhost:8081`. |
| `Cannot find native module 'ExpoPrint'` | Rebuild native app (Expo Go won’t have it) |
| Expo can’t see device | Use `--device SM_G988B` instead of IP:port |
| `not enough space` on emulator install | Emulator `/data` is full. Uninstall old apps: `adb uninstall com.northcareai.app`, or deploy to physical device |
| `robocopy` runs forever / copies recursively | **Never** robocopy `node_modules` — use the 3-step sync procedure above |
| `Unable to resolve "whisper.rn"` in Metro | Run `npm install` in `C:\NorthCare\mobile` (not `--legacy-peer-deps`) |
| `react-native-worklets` directory not found in Gradle | Same fix — clean `node_modules` and fresh `npm install` |

---

## Related docs

- [`ANDROID_DEVELOPMENT_BUILD.md`](ANDROID_DEVELOPMENT_BUILD.md) — general native build notes and blockers  
- [`ANDROID_RUNTIME_RECOVERY.md`](ANDROID_RUNTIME_RECOVERY.md) — Metro / adb recovery  
- [`OFFLINE_AI_LOCAL_SETUP.md`](OFFLINE_AI_LOCAL_SETUP.md) — short path + on-device model  
- [`REFERRAL_VERIFY_POPUP_PDF_SLIP_CHECKPOINT.md`](REFERRAL_VERIFY_POPUP_PDF_SLIP_CHECKPOINT.md) — successful S20 rebuild record (2026-08-04)
