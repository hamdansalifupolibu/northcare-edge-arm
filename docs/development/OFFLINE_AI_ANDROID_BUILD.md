# Offline AI Android Build — Stage 1

## Baseline blocker (before llama.rn)

Earlier Reach R6 short-path attempts failed on:

`:react-native-community_netinfo:generateCodegenArtifactsFromSchema`

Investigation for this stage found a mis-set `ANDROID_HOME` pointing at `cmdline-tools/latest/bin` and a stale short-path Android tree. With:

- `ANDROID_HOME` / `ANDROID_SDK_ROOT` set to the Android SDK root
- clean `expo prebuild --platform android --clean`
- existing lockfile / NetInfo `12.0.1` preserved

the baseline `:app:assembleDebug` succeeded **before** installing `llama.rn`, including NetInfo compile/codegen tasks.

## llama.rn build

1. Pin `llama.rn@0.12.8`
2. Add Expo config plugin with `enableOpenCLAndHexagon: false`
3. Keep `newArchEnabled=true`
4. Rebuild from the short path:

```bash
npx expo prebuild --platform android --clean
cd android
gradlew.bat :app:assembleDebug
```

## Notes

- Expo Go is insufficient.
- Do not disable New Architecture.
- Do not remove NetInfo.
