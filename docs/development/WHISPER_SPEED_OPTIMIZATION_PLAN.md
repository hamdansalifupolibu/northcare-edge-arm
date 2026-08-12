# Whisper Transcription Speed Optimization Plan

**Status:** Phase 1 implemented (2026-08-07) — beam=1, thread tuning, early model pre-warm  
**Date:** 2026-08-06 (plan) · updated 2026-08-07  
**Device:** Samsung Galaxy S20 Ultra (SM-G988B) — Snapdragon 865, 12 GB RAM  
**Current model:** Whisper Base English GGML (~148 MB, unquantised)

## Implementation status (2026-08-07)

| Strategy | Status |
|---|---|
| Reduce beam to 1 | **Done** — `whisperTranscriptionOptions.ts` |
| `maxThreads: 4` | **Done** |
| Pre-warm on voice flow entry | **Done** — entry, consent, record, quick-start screens |
| Progressive UI feedback | **Done** — elapsed timer + step checklist on transcript screen |
| Switch to `tiny.en` | Not implemented — optional if still too slow |
| `speedUp: true` | Not implemented — needs field validation first |

Expected result: ~1 min recording should transcribe in roughly **5–12 s** (down from ~20–30 s) on S20 Ultra with model already warm.

---

The transcription pipeline has three phases, each contributing to total latency:

| Phase | What happens | Estimated time |
|---|---|---|
| **1. Audio decode** | MediaCodec decodes M4A → PCM, resamples to 16 kHz mono | ~1–3 s for a 2-min recording |
| **2. Model load** (first call) | `initWhisper` loads 148 MB model into memory | ~2–4 s (cached after first call) |
| **3. Inference** | Whisper beam search over audio segments | ~10–30 s for a 2-min recording |

Phase 3 (inference) is the dominant bottleneck. The current settings use `beamSize: 5` and `bestOf: 5`, which run 5 parallel hypotheses — accurate but slow.

## Optimization strategies (ranked by impact)

### 1. Reduce beam search parameters (HIGH impact, ZERO risk)

The single biggest speedup. Currently `beamSize: 5, bestOf: 5` means Whisper evaluates 5 candidate transcriptions per segment and picks the best. For field recordings with a single clear speaker, this is overkill.

**Change:**
```typescript
// Current (slow, high accuracy)
{ beamSize: 5, bestOf: 5 }

// Proposed (fast, still good accuracy for clear speech)
{ beamSize: 1, bestOf: 1 }
```

**Expected speedup:** 3–5x faster inference (beam=1 is greedy decoding — one pass instead of five).  
**Risk:** Slightly less accurate on noisy/overlapping speech. For a single health worker speaking clearly, the difference is negligible.  
**Effort:** One-line change in `WhisperTranscriptionProvider.ts`.

### 2. Switch to Whisper Tiny English model (HIGH impact, LOW risk)

The `tiny.en` model is 4x smaller than `base.en` and significantly faster, with only modest accuracy loss for clear English speech.

| Model | Size | Relative speed | Accuracy (WER on LibriSpeech) |
|---|---|---|---|
| `ggml-tiny.en.bin` | ~39 MB | ~4x faster than base | ~6.8% |
| `ggml-base.en.bin` (current) | ~148 MB | baseline | ~5.0% |

**Change:** Update `whisper-model-manifest.json` to point to the tiny model, update SHA-256 and byte size, re-download on device.  
**Expected speedup:** 3–4x faster inference, 4x faster model load, 4x less memory.  
**Risk:** Slightly higher word error rate, but acceptable for case notes that the worker reviews and edits anyway.  
**Effort:** Update manifest + re-provision model on device (~5 min).

### 3. Increase thread count (MEDIUM impact, ZERO risk)

`whisper.rn` defaults to 2 threads on 4-core devices, 4 threads on 8-core. The S20 Ultra has an **8-core** Snapdragon 865 (1x 2.84 GHz + 3x 2.42 GHz + 4x 1.80 GHz), so it should already use 4 threads by default.

**Change:** Explicitly set `maxThreads: 4` (or experiment with `6`) in transcription options.  
**Expected speedup:** 10–30% if the default wasn't already optimal.  
**Risk:** Too many threads can cause contention on efficiency cores. Test 4 vs 6.  
**Effort:** One option added to `WhisperTranscriptionProvider.ts`.

### 4. Pre-warm the model context on app start (MEDIUM impact, already partially done)

The `preloadWhisperModel()` function already exists and is called in `VoiceQuickStartScreen`. This eliminates the ~2–4 s model load when the user finishes recording.

**Current state:** Already implemented. Verify it's being called early enough (on consent screen or voice entry, not just on quick-start).  
**Improvement:** Call `preloadWhisperModel()` when the worker navigates to any voice-related screen, not just quick-start.

### 5. Use `speedUp: true` option (MEDIUM impact, LOW risk)

`whisper.rn` supports a `speedUp` flag that processes audio at 2x speed by downsampling. This halves the audio length Whisper processes.

**Change:** Add `speedUp: true` to transcription options.  
**Expected speedup:** Up to 2x faster.  
**Risk:** Reduced accuracy, especially for fast speech. Needs testing with actual field recordings.  
**Effort:** One option added.

### 6. Show progressive UI feedback (LOW speed impact, HIGH UX impact)

Even if transcription takes 15+ seconds, the experience feels faster with progress feedback:
- Show elapsed time during transcription ("Transcribing... 5s")
- Use `whisper.rn`'s segment callbacks to show partial text as it appears
- Show the raw transcript immediately, then clean/format it

**Effort:** Moderate UI changes to `VoiceTranscriptScreen.tsx`.

### 7. Limit max audio duration for processing (LOW impact, SIMPLE)

Currently `VOICE_MAX_RECORDING_DURATION_MS = 3 minutes`. For the hackathon, encourage shorter recordings in the UI copy (e.g. "Speak for 30–60 seconds for fastest results").

**No code change needed** — just UX guidance.

## Recommended implementation order

For the hackathon, apply these in order (stop when speed is acceptable):

| Priority | Strategy | Speedup | Effort |
|---|---|---|---|
| **1st** | Reduce beam to 1 | 3–5x | 1 min |
| **2nd** | Add `maxThreads: 4` | 10–30% | 1 min |
| **3rd** | Switch to tiny.en model | 3–4x | 10 min |
| **4th** | Add `speedUp: true` | up to 2x | 1 min |
| **5th** | Progressive UI feedback | perceived | 30 min |

Strategies 1 + 2 alone should cut transcription time from ~20 s to ~5–8 s for a 1-minute recording. Adding strategy 3 (tiny model) would bring it under 3 seconds.

## What NOT to do

- **Do not switch to a server-based API** (Google Cloud Speech, etc.) — this breaks the offline-first requirement and sends health data off-device.
- **Do not remove the hallucination cleaning** — it's a safety net even with correct audio decoding.
- **Do not set temperature > 0** — this adds randomness that can cause hallucinations. Keep `temperature: 0` for deterministic output.

## Files to modify (when implementing)

| File | Change |
|---|---|
| `WhisperTranscriptionProvider.ts` | Adjust `beamSize`, `bestOf`, `maxThreads`, `speedUp` options |
| `whisper-model-manifest.json` | Update if switching to tiny.en model |
| `whisperModelManager.ts` | No changes needed (handles any model from manifest) |
| `VoiceTranscriptScreen.tsx` | Progressive UI feedback (optional) |
