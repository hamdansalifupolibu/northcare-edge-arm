# Voice Recording Consent Foundation

**Stage:** 11  
**Date:** 2026-08-02  
**Status:** Provisional — requires professional / legal review

## Core principles

1. **Recording consent ≠ microphone permission.** OS mic permission is necessary but not sufficient. Caregiver/client recording consent is a separate explicit worker-recorded decision.
2. **Consent never defaults to recorded.** The UI and domain layer require an explicit choice. `unknown` cannot proceed to recording.
3. **Decline blocks the microphone.** If consent is `declined`, the worker must use the **manual transcript path** instead of recording.
4. **Deferred is not decline.** `deferred` may allow recording when product policy permits deferral copy; `declined` does not.

## Consent version

Current copy version: `voice-recording-consent-v1-provisional`

Update this version when wording changes after legal review so audit trails remain traceable.

## Persisted fields

On `voice_capture_sessions`:

- `consent_status`: `unknown` | `recorded` | `declined` | `deferred` | `notApplicable`
- `consent_version`: string identifier for the consent copy shown

## Provisional worker-facing intent (not final legal text)

> Before recording, confirm that the caregiver (or authorised representative) understands that this visit conversation may be recorded on this device to help document care notes. Recording is optional. If they do not agree, enter notes manually instead.

**Do not treat this block as approved legal copy.**

## What consent does not cover

- Cloud upload or third-party transcription (not implemented in Stage 11 production)
- Dagbanli audio content (no fabricated translations)
- Automatic saving of transcript or extraction without worker review

## Related implementation

- Domain: `apps/mobile/src/features/voice/domain/consent.ts`
- Screen: `VoiceConsentScreen`
- Constants: `VOICE_RECORDING_CONSENT_VERSION` in `domain/constants.ts`

## Outstanding review

- Professional review of final consent wording (English; Dagbanli later)
- Facility / programme policy alignment
- Whether `deferred` should remain allowed in pilot builds
