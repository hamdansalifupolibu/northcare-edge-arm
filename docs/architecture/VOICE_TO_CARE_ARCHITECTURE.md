# Voice-to-Care Architecture

**Stage:** 11  
**Date:** 2026-08-02  
**Status:** Implemented

## Overview

Voice-to-Care captures optional visit audio locally, supports manual or provider-based transcription, runs structured extraction through gated providers, and requires per-field worker review before any suggestion is applied to clinical records.

## Feature layout

```text
apps/mobile/src/features/voice/
├── application/createVoiceServices.ts   # Orchestration — consent, record, transcribe, extract, review, apply
├── audio/                               # expo-audio adapter, file manager, permissions
├── domain/                              # States, consent, policies, provider contracts
├── providers/
│   ├── transcription/                   # Select + unavailable + dev simulation + manual path
│   └── extraction/                      # Select + unavailable + dev simulation + schema registry
├── screens/                             # Consent, record, playback, transcript, review, success
├── hooks/useVoiceServices.ts
└── __tests__/                           # Consent, gates, file manager, review, apply rollback

apps/mobile/src/data/repositories/sqlite/sqliteVoiceRepositories.ts
apps/mobile/src/data/database/migrations/005_voice_capture.ts
```

Routes (worker, auth-gated):

- Client: `/(worker)/clients/[clientId]/voice/*`
- Visit-linked: `/(worker)/clients/[clientId]/visits/[visitId]/voice/*`
- Development: `/(development)/voice-to-care-preview`

## Session lifecycle

```text
draft → consentPending → readyToRecord → recording → recorded
  → transcribing → transcriptReady → extracting → reviewRequired
  → confirmed | discarded | failed
```

UI recording states are tracked separately (`ui_state`) from persisted session status.

## Data model (schema v5)

| Table | Purpose |
|---|---|
| `voice_capture_sessions` | Session header, consent, provider IDs, retention |
| `voice_transcripts` | Text + source (`provider` / `manual` / `developmentSimulation`) |
| `voice_extraction_runs` | Provider + schema version per attempt |
| `voice_extraction_suggestions` | Typed targets; review status per row |
| `attachments` | File metadata pointer (URI, duration, format) — not blob |

## Provider gates

Selection: `selectTranscriptionProvider()` / `selectExtractionProvider()`.

| Environment | Transcription | Extraction |
|---|---|---|
| production / staging | Unavailable (fail closed) | Unavailable (fail closed) |
| development | Dev simulation (synthetic) | Dev simulation (synthetic) |

**Approved production providers: 0** for both types.

Manual transcript: always available via `manual.worker.transcript.v1` — no ASR required.

Inventory: `implementation/voice-provider-inventory.json`

## Extraction schema gate

Registry loads only environment-allowed schemas:

- Production: `APPROVED_FOR_PILOT` only — **count 0** → fail closed
- Development: includes one `APPROVED_FOR_DEVELOPMENT` synthetic schema

Inventory: `implementation/voice-extraction-schema-inventory.json`

## Apply boundaries

Apply runs only when:

1. Worker confirms transcript
2. Every suggestion has review decision (accept / edit / reject)
3. Session is not locked
4. Target passes `assertAllowedExtractionTarget` (forbidden list includes diagnosis, medication, risk priority, referral decisions, etc.)
5. Visit-linked targets (e.g. screening draft answers) require `encounter_id`

No automatic apply. Confidence does not bypass review.

Apply is transactional; failure rolls back clinical writes.

## Retention

After apply, worker chooses:

- `retained` — keep managed audio on device
- `pendingDecision` / delete path — remove managed file when worker deletes

`retention_status` on session; file deletion via file manager.

## Audio storage

- Managed directory: `voice-captures/` (app-private)
- Random filenames: `vc_<hex>.m4a`
- See `docs/security/LOCAL_AUDIO_SECURITY_LIMITATIONS.md`

## Safety boundaries

- No diagnose / prescribe / dosage extraction
- No LLM as primary danger-sign engine
- Development simulation marked `isSynthetic`
- No logging of transcript text or audio paths in production diagnostics

## Related docs

- `docs/development/VOICE_AUDIO_TECHNOLOGY_DECISION.md`
- `docs/safety/VOICE_RECORDING_CONSENT_FOUNDATION.md`
- `docs/architecture/SQLITE_SCHEMA.md` (v5 voice tables)
