# Offline AI Local Setup — Stage 1

## Prerequisites

- Node.js 22.x
- Android SDK with `ANDROID_HOME` pointing to the SDK root (not `cmdline-tools/.../bin`)
- Short-path working copy recommended on Windows (for example `C:\NorthCare\mobile`)
- Samsung Galaxy S20 Ultra authorised over adb for completion evidence

## Install

From `apps/mobile` (or the short-path copy):

```bash
npm install
npx expo prebuild --platform android --clean
npx expo run:android
```

Pinned runtime: `llama.rn@0.12.8`.

## Model provisioning

Open development route `/(development)/offline-ai` after a development identity/workspace flow.

Prefer:

1. **Download and verify model** on a networked device once, or
2. **Import local GGUF** from a previously verified file

Provisioning never runs automatically at launch.
