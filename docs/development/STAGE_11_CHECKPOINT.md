# Stage 11 Checkpoint Report

**Stage:** 11 — Voice-to-Care Capture and Structured Extraction  
**Status:** COMPLETE — READY FOR STAGE 12 APPROVAL  
**Date:** 2026-08-02  

## Environment preflight

| Check | Result |
|---|---|
| Metro :8081 | Free |
| Package manager | npm |
| `@tybys/wasm-util` | Not present |
| React tree | `react@19.2.3`, `react-native@0.86.2`, `react-dom` not installed |
| Typecheck (pre) | Pass |
| Tests (pre) | 47 suites / 213 tests pass (pre-Stage-11 baseline) |
| Expo Doctor (pre) | Not re-run preflight; post gate 20/20 |

## Dependency-health result

Updated `docs/development/DEPENDENCY_HEALTH.md`.

| Package | Version | Reason |
|---|---|---|
| `expo-audio` | ~57.0.3 | SDK 57 recording + playback |
| `expo-file-system` | ~57.0.1 | App-private managed voice files |

Install command:

```bash
npx expo install expo-audio expo-file-system -- --legacy-peer-deps
```

`--legacy-peer-deps` required for peer resolution consistency with prior stages. Metro was free during install. No Expo/React/RN upgrade. No `expo-av` added.

## Schema audit

Migration **005** (`005_voice_capture`) brings schema to **v5**.

| Addition | Notes |
|---|---|
| `voice_capture_sessions` | Session lifecycle, consent, provider IDs, retention |
| `voice_transcripts` | Provider / manual / dev-simulation sources |
| `voice_extraction_runs` | Schema-versioned extraction attempts |
| `voice_extraction_suggestions` | Typed targets; per-item review status |
| `attachments` columns | `duration_ms`, `audio_format_version`, `original_filename` |

Audio bytes remain on filesystem — never SQLite blobs. Screens and services use repositories only.

## Voice workflow

| Field | Value |
|---|---|
| Feature root | `apps/mobile/src/features/voice/` |
| Entry points | Client profile; visit details (visit-linked session) |
| Consent | Explicit decision required; never defaults to recorded |
| Decline path | Manual transcript — mic blocked |
| Recording | expo-audio; pause/resume/stop/cancel; max duration enforced |
| Playback | expo-audio player; delete managed file supported |
| File storage | `voice-captures/` app-private dir; random `vc_*.m4a` filenames |
| Background | Recording/playback stops on lock or background — no background capture |

## Provider gates

| Provider type | APPROVED (production) | Development |
|---|---|---|
| Transcription | **0** — `production.unavailable.transcription.v1` | `development.simulation.transcription.v1` |
| Extraction | **0** — `production.unavailable.extraction.v1` | `development.simulation.extraction.v1` |
| Manual transcript | Always available (`manual.worker.transcript.v1`) | Same |

Production and staging fail closed for ASR and structured extraction.

## Extraction schema gate

| Field | Value |
|---|---|
| `APPROVED_FOR_PILOT` count | **0** |
| Development schemas | 1 synthetic (`synthetic.dev.voice.encounter-notes.v1`) |
| Production behaviour | Fail closed — no schema loads |

## Apply boundaries

- Worker must confirm transcript before extraction
- Each suggestion: accept / edit / reject individually
- Forbidden targets blocked (diagnosis, medication, risk priority, referral decisions, etc.)
- Apply requires authenticated session; transactional with rollback on failure
- Retention decision recorded after successful apply

## Commands (post)

| Check | Result |
|---|---|
| Typecheck | **Pass** |
| Lint | **Pass** (0 errors; warnings cleaned) |
| Tests | **55 suites / 232 tests** pass |
| Expo Doctor | **20/20 passed** |
| adb | `emulator-5554` **offline** — see `ANDROID_VOICE_VALIDATION.md` |

## Packages installed

- `expo-audio@~57.0.3`
- `expo-file-system@~57.0.1`

## Stitch screens covered

- Voice capture flow (consent → record → playback → transcript → review → success) — built from product requirements; extraction review screen was missing from Stitch finals
- Development preview — diagnostics only

## Offline behaviour

Full offline path: consent → record → playback → manual or dev-simulation transcript → dev-simulation extraction (development only) → review → apply. Production transcription/extraction unavailable offline and online (fail closed until providers approved).

## Accessibility review

- Mic button states labelled
- Consent actions labelled; decline path explicit
- Playback controls labelled
- Review actions (accept/edit/reject) per suggestion
- Reduced-motion respected where applicable

## Security and privacy review

- Secrets committed? **No**
- Real patient data? **No** — synthetic fixtures only
- Audio not logged; transcript text not logged in production diagnostics
- Random filenames; app-private directory
- No encryption claims for audio at rest

## Known limitations

- Zero approved production transcription providers
- Zero approved production extraction providers
- Zero `APPROVED_FOR_PILOT` extraction schemas
- Android emulator offline — physical Samsung mic validation pending
- Provisional consent wording — legal review outstanding
- No Dagbanli ASR
- Development simulation clearly marked synthetic
- Background recording disabled by design

## Outstanding tasks

- Physical-device microphone / playback validation (Samsung)
- Pilot-ready extraction schemas (clinical review)
- Approved production ASR and extraction providers
- Professional review of recording-consent copy
## Unexpected changes

None reported. Attachment INSERT placeholder count was corrected when voice attachment creates ran in tests.

## Git status

No commit created (awaiting approval).

## Recommended next stage

**STAGE 12 — NUTRITION ASSESSMENT AND REVIEWED GUIDANCE** — do not start without approval.

## Approval required

**STOP — await approval before continuing.**

STAGE 11 COMPLETE — READY FOR STAGE 12 APPROVAL
