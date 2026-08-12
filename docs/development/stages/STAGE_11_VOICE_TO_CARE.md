# STAGE 11 — Voice-to-Care Capture and Structured Extraction

**Status:** COMPLETE (implementation)  
**Date:** 2026-08-02  
**App:** `apps/mobile/` (Expo SDK 57)

## Purpose

Offline-first voice capture with mandatory worker review before any AI-derived field is persisted. Establishes recording, consent, transcription-provider, and structured-extraction architecture with production fail-closed gates.

## Included

- Real audio recording and playback via `expo-audio`
- Private managed audio files via `expo-file-system` (app-private directory; random filenames)
- Microphone permission handling (OS permission separate from recording consent)
- Recording-consent foundation (never defaults to recorded; decline blocks mic)
- Voice-capture session persistence (SQLite migration **005** — schema v5)
- Transcription-provider architecture (production: 0 approved — fail closed)
- Structured-extraction-provider architecture (production: 0 approved — fail closed)
- Development-only simulation providers (production-gated)
- Manual transcript fallback path
- Typed extraction suggestions with per-item accept / edit / reject review
- Apply boundaries — confirmed suggestions only; forbidden clinical targets blocked
- Audio retention decision (keep / delete) after apply
- Client-level and visit-linked voice flows
- Development preview screen for provider/schema inventory

## Explicitly excluded

- `expo-av` in new code
- Speech recognition, Whisper, llama, ONNX, TensorFlow, or on-device ASR/LLM
- Production transcription or extraction providers (count: **0**)
- `APPROVED_FOR_PILOT` extraction schemas (count: **0**)
- Background recording
- Audio as SQLite blobs
- Automatic apply without worker confirmation
- Diagnosis, medication, dosage, referral decisions, or risk priority as extraction targets
- Cloud upload of audio without future explicit policy
- Stage 12 (nutrition)

## Content and provider gates

| Gate | Production | Development |
|---|---|---|
| Transcription providers (`APPROVED`) | **0** — unavailable provider | Synthetic simulation only |
| Extraction providers (`APPROVED`) | **0** — unavailable provider | Synthetic simulation only |
| Extraction schemas (`APPROVED_FOR_PILOT`) | **0** — fail closed | 1 synthetic `APPROVED_FOR_DEVELOPMENT` schema |

## Architecture pointers

- Feature root: `apps/mobile/src/features/voice/`
- Application services: `createVoiceServices.ts`
- Repositories: `apps/mobile/src/data/repositories/sqlite/sqliteVoiceRepositories.ts`
- Migration: `apps/mobile/src/data/database/migrations/005_voice_capture.ts`
- Provider inventories: `implementation/voice-provider-inventory.json`, `implementation/voice-extraction-schema-inventory.json`
- Architecture: `docs/architecture/VOICE_TO_CARE_ARCHITECTURE.md`
- Audio technology: `docs/development/VOICE_AUDIO_TECHNOLOGY_DECISION.md`
- Consent foundation: `docs/safety/VOICE_RECORDING_CONSENT_FOUNDATION.md`
- Local audio security: `docs/security/LOCAL_AUDIO_SECURITY_LIMITATIONS.md`

## Packages added

| Package | Version | Install |
|---|---|---|
| `expo-audio` | `~57.0.3` | `npx expo install expo-audio expo-file-system -- --legacy-peer-deps` |
| `expo-file-system` | `~57.0.1` | (same command) |

Metro was free during install. No Expo / React / React Native upgrade.

## Acceptance met (summary)

- [x] Offline recording and playback with expo-audio
- [x] App-private file management with expo-file-system
- [x] Consent gate before mic; decline routes to manual transcript
- [x] Session / transcript / extraction run / suggestion persistence (schema v5)
- [x] Production transcription and extraction fail closed
- [x] Development simulation providers gated off production/staging
- [x] Manual transcript path without mic
- [x] Per-suggestion review; no auto-apply
- [x] Forbidden extraction targets enforced
- [x] No expo-av, no STT/LLM libraries in new code
- [ ] Physical Android mic validation — **PENDING** (emulator offline)

## Exit

See `docs/development/STAGE_11_CHECKPOINT.md`.

## Next stage (do not start)

**STAGE 12 — NUTRITION ASSESSMENT AND REVIEWED GUIDANCE** — not approved; do not implement.
