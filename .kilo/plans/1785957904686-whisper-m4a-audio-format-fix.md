# Fix Whisper transcription — M4A/WAV format mismatch

## Root Cause

The **on-device Whisper model IS working correctly** — the model weights are fine (148MB `ggml-base.en.bin`, verified SHA-256). The desktop Python test confirmed the model can transcribe properly ("The child is 2 years old, has had diarrhea since yesterday...").

The actual bug is an **audio format mismatch** in the `whisper.rn` native Android layer (`WhisperContext.java:384-406`):

```java
public static float[] decodeWaveFile(File file) throws IOException {
    ...
    byteBuffer.position(44);  // HARD-CODED WAV HEADER OFFSET
    ShortBuffer shortBuffer = byteBuffer.asShortBuffer();
```

This method assumes the input file is a **WAV** file with a 44-byte RIFF header. It skips 44 bytes and then interprets the remaining bytes as 16-bit PCM samples.

But the app records audio in **`.m4a` (AAC in MP4 container)** format — see `VOICE_AUDIO_CODEC: 'aac'` and `VOICE_AUDIO_EXTENSION: 'm4a'` in `constants.ts`. When the `.m4a` file is passed to Whisper's native `transcribeFile()`, the method reads the MP4 container binary data as if it were raw PCM audio. This produces garbage audio input, and Whisper generates hallucinations like "Suspense music" instead of transcribing actual speech.

## Why This Explains All Symptoms

| Symptom | Explanation |
|---|---|
| "Suspense music" / "Intense music" as transcription | Whisper receives garbage audio (MP4 container bytes misinterpreted as PCM), so it hallucinates sound-effect captions |
| Transcription is very short | The misinterpreted PCM data likely contains mostly silence/noise, so Whisper produces minimal output |
| File plays fine on PC | The `.m4a` container is valid — the issue is only in how `whisper.rn` reads it (as WAV/PCM) |
| Desktop Python Whisper works | Python `whisper` package has its own `ffmpeg`-based audio decoder that handles MP4/M4A correctly |

## Decision: Do NOT change the Whisper model

Switching to a different model will **not fix this**. The problem is not model accuracy — it's the native decoder assuming WAV format. Any Whisper variant (tiny, base, small, medium) would produce the same garbage output with this decoder bug.

## Fix Options

### Option A (Recommended): Convert M4A → WAV before passing to Whisper

Add a conversion step in `WhisperTranscriptionProvider.ts` that uses `ffmpeg` (via `react-native-ffmpeg` or the system media decoder) to convert the `.m4a` file to a temporary 16kHz mono WAV file before passing the path to `context.transcribe()`.

**Pros:** Minimal changes to the codebase, keeps `whisper.rn` as the engine.
**Cons:** Requires adding `react-native-ffmpeg` (or similar) as a native dependency, which means a native rebuild (~15 min on this Windows path-length setup).

### Option B: Pre-convert at recording time

Modify `VoiceQuickStartScreen.tsx` / `fileManager.ts` to save recordings as WAV instead of M4A. This would change `VOICE_AUDIO_CODEC` from `'aac'` to `'pcm'` and the extension from `'m4a'` to `'wav'`.

**Pros:** No runtime conversion overhead, Whisper gets WAV natively.
**Cons:** WAV files are ~6x larger than M4A (uncompressed PCM). A 2-minute recording would be ~20MB instead ~3MB. Changes the storage format for all voice recordings.

### Option C: Use `expo-av` or `expo-audio` to decode M4A → PCM buffer, write WAV, pass to Whisper

Read the `.m4a` using `expo-av`'s `Audio.Sound`, which natively decodes AAC. Then write the decoded PCM samples to a temporary WAV file.

**Pros:** No new native dependencies (uses existing `expo-av`/`expo-audio`).
**Cons:** Requires writing PCM-to-WAV encoding logic (straightforward but adds ~50 lines).

## Recommended Approach: Option C

Option C is the best balance:
- No new native dependencies (no native rebuild needed for JS-only change)
- Uses `expo-av` (already in the dependency tree) for decoding
- WAV writing is a simple header + raw PCM
- Keeps the M4A storage format (smaller files, same as now)
- Minimal risk of breaking other parts of the system

## Implementation Steps

1. **Add WAV writer utility** — Create a function that writes 16-bit PCM samples + 44-byte WAV header to a temp file
2. **Add M4A → WAV converter** — Use `expo-av`'s `Audio.Sound` to decode the `.m4a`, read PCM samples, write WAV file
3. **Update `WhisperTranscriptionProvider.ts`** — Before calling `context.transcribe()`, check if the audio file is M4A. If so, convert to WAV at the native path, then pass the WAV path to Whisper. Clean up the temp WAV after transcription.
4. **Add error handling** — If conversion fails, fall back gracefully with a clear error message
5. **Verify** — Re-run the app on the device and test that actual speech is transcribed

## Files to Modify

- `apps/mobile/src/features/voice/providers/transcription/WhisperTranscriptionProvider.ts` — Add WAV conversion before Whisper `transcribe()` call
- `apps/mobile/src/features/voice/providers/transcription/whisperAudioConverter.ts` — New file: M4A → WAV conversion utility (using `expo-av`)
- `apps/mobile/src/features/voice/application/createVoiceServices.ts` — Pass additional context (mimeType) to the transcription provider if needed

## Risk Assessment

- **Low risk**: The conversion is only a preprocessing step — if it fails, the existing error handling catches it
- **No schema changes**: Audio file storage format stays M4A
- **No model changes**: Keep the current 148MB `ggml-base.en.bin` (well under the 400MB limit)
- **Performance**: WAV conversion adds ~2-5 seconds for a 2-minute file on modern Android hardware

## Validation

1. Record a voice note on the device
2. Navigate to the transcript screen
3. Verify the transcript shows actual spoken words (not "Suspense music")
4. Check the `console.info` diagnostic log shows `cleanedLength` > 10
5. Verify the existing `cleanWhisperTranscript` tests still pass
6. Verify the paused-state test playback still works (unaffected by this change)