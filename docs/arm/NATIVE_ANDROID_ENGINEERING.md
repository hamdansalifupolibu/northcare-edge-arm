# Native Android engineering — Arm audio pipeline

**Status:** Engineering write-up complete; decode overhead measurement pending device  
**Patch:** `apps/mobile/patches/whisper.rn+0.2.5.patch`  
**Apply:** `apps/mobile` `postinstall` → `npx patch-package`

## Problem

NorthCare Voice-to-Care records **M4A/AAC** via `expo-audio`. Upstream `whisper.rn` expected **WAV/PCM**. Feeding M4A into the old path produced unreliable / hallucinated transcripts.

## Why native

Decoding compressed audio to the float PCM layout Whisper expects is best done with Android media APIs below the React Native bridge:

- Correct codec handling (`MediaExtractor` + `MediaCodec`)
- Channel downmix and resampling close to the audio framework
- Avoid shipping a second JS decoder or forcing WAV-only capture UX

## Solution (Arm Android audio pipeline)

```text
M4A / AAC (or other compressed)
   ↓
MediaExtractor  (select audio track)
   ↓
MediaCodec      (decode to PCM)
   ↓
Stereo → Mono
   ↓
Resample → 16 kHz
   ↓
Normalize float PCM [-1, 1]
   ↓
whisper.cpp full()
```

WAV/RIFF files still use the original direct PCM path.

Key patch behaviour (see patch file for full Java):

- `transcribeFile` calls `decodeAudioFile` instead of `decodeWaveFile` only
- `decodeAudioFile` sniffs RIFF magic; otherwise `decodeCompressedAudio`
- Logs sample counts / source rate via `Log.d` (not yet exposed as decode-ms to JS)

## Why this is an Arm / Android contribution

The optimization competition is not only model math. Making the **real capture format** work on Arm Android phones is developer-experience and edge-pipeline engineering:

- Reusable via `patch-package`
- Required for any on-device Whisper workload that records M4A
- Keeps the healthcare UX on standard Android recording formats

## Measurement status

| Item | Status |
|---|---|
| Pipeline documented | Done |
| Patch preserved in repo | Done |
| Decode latency isolated in JS | **Not available** — bundled inside `transcribe` |
| Decode overhead on S20 Ultra | **Pending** device session |

Future improvement (optional, post-baseline): extend the patch to emit decode elapsed ms through a native log tag or WritableMap field so Edge Lab can split `m4a_decode` from `whisper_inference`.

## Reuse for another developer

1. Keep `patches/whisper.rn+0.2.5.patch`  
2. Ensure `postinstall` runs `patch-package`  
3. Rebuild the native Android binary after clean install  
4. Record M4A and call `context.transcribe(path, options)`  

Do not remove the patch without an alternate decode strategy.
