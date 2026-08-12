# Voice Audio Technology Decision

**Stage:** 11  
**Date:** 2026-08-02  
**Status:** APPROVED and implemented

## Decision

Use **`expo-audio`** for recording and playback and **`expo-file-system`** for app-private managed audio files.

## Packages

| Package | Version | Role |
|---|---|---|
| `expo-audio` | `~57.0.3` | Prepare / record / pause / resume / stop; playback via `useAudioPlayer` |
| `expo-file-system` | `~57.0.1` | Managed `voice-captures/` directory; promote temp files; delete |

Install (Stage 11):

```bash
npx expo install expo-audio expo-file-system -- --legacy-peer-deps
```

Metro was free. No Expo / React / React Native upgrade.

## Rejected for new code

| Option | Reason |
|---|---|
| `expo-av` | Superseded by modular `expo-audio` in Expo SDK 57; not used in Stage 11 voice feature |
| Speech-recognition SDKs | No approved production ASR; no Whisper / cloud STT wired |
| On-device ML (ONNX, TensorFlow, llama.cpp) | Out of Stage 11 scope; would likely require development build |

## Recording behaviour

- Foreground recording only — **background recording disabled**
- Recording stops on app lock or background (`reason: 'lock' | 'background'`)
- Audio format: AAC in M4A container (`audio/mp4`; format version 1)
- Max duration: 3 minutes (provisional)
- Temp file promoted to managed directory with random filename (`vc_<uuid>.m4a`)

## File layout

- Directory: app-private `voice-captures/` via expo-file-system
- Metadata: SQLite `attachments` row + `voice_capture_sessions.attachment_id`
- **No audio blobs in SQLite**

## Expo Go vs development build

| Capability | Expo Go (Stage 11) |
|---|---|
| Recording + playback | Supported via expo-audio |
| App-private file management | Supported via expo-file-system |
| Future local ASR / native ML module | **Likely requires development build** |

Revisit `docs/architecture/EXPO_RUNTIME_STRATEGY.md` when the first Go-incompatible ASR module is approved for production.

## Related docs

- `docs/architecture/VOICE_TO_CARE_ARCHITECTURE.md`
- `docs/security/LOCAL_AUDIO_SECURITY_LIMITATIONS.md`
- `implementation/voice-provider-inventory.json`
