# Implementation Checkpoint — NorthCare Edge optimization loop

**Stage:** NorthCare Edge Phases 3–8 (baseline → bottleneck → experiments → promote)  
**Status:** Complete — EXP-06 promoted to production  
**Scope approved:** Local Arm optimization; explicit promotion of accepted candidate  

## What was implemented

- Captured S20 Ultra baseline and bottleneck (`whisper_inference` ~83%)
- Ran one-variable lab experiments EXP-01, EXP-02, EXP-03 (all rejected)
- Added lab-only `whisperModelFilename` override; pushed `ggml-tiny.en.bin` to device
- Ran EXP-06; quality gate **ACCEPTED** (−53.8% whisper_inference)
- **Promoted** `ggml-tiny.en.bin` into `whisper-model-manifest.json` (human go-ahead)
- Documented full baseline→done trail + `PROMOTION_EXP06.md`

## Files created

- `docs/arm/BASELINE_TO_DONE_TRAIL.md`
- `docs/arm/PROMOTION_EXP06.md`
- `docs/arm/EXPERIMENT_LOG.md` (rewritten)
- `docs/arm/experiments/EXP_06_SMALLER_WHISPER.md`
- `docs/arm/PHASE_OPTIMIZATION_CHECKPOINT.md`
- `benchmarks/raw/edge_msp6cf7n_d5qs.json`
- `benchmarks/optimized/s20-ultra-accepted-exp06-2026-08-11.md`

(Prior in-session: EXP-01–03 docs + raw JSON already present.)

## Files modified

- `apps/mobile/src/features/voice/content/whisper-model-manifest.json` (**production**)
- `apps/mobile/src/features/voice/providers/transcription/whisperTranscriptionOptions.ts` (estimate only)
- `apps/mobile/src/features/edge-lab/services/runEdgeLabHarness.ts`
- `apps/mobile/src/features/edge-lab/services/edgeLabWhisperProbe.ts`
- `apps/mobile/src/features/edge-lab/experiments/experimentCatalog.ts`
- `apps/mobile/src/features/edge-lab/screens/EdgeLabExperimentsScreen.tsx`
- `apps/mobile/src/features/edge-lab/screens/EdgeLabTimelineScreen.tsx`
- `docs/arm/BASELINE_FREEZE.md`
- `docs/arm/OPTIMIZATION_TIMELINE.md`
- `docs/arm/EXPERIMENTS_CATALOG.md`
- `docs/arm/README.md`
- `docs/arm/ARM_OPTIMIZATION.md`
- `docs/arm/NORTHCARE_EDGE_README_SKELETON.md`
- `PROJECT_STATUS.md`

## Files deleted

- None

## Commands run

```text
adb push ggml-tiny.en.bin → device files/whisper/
edge-lab-auto-run.config: {"experimentId":"exp-06-smaller-whisper-conditional","whisperModelFilename":"ggml-tiny.en.bin"}
touch files/edge-lab-auto-run.trigger
adb logcat → EDGE_LAB_EVIDENCE (run edge_msp6cf7n_d5qs)
```

## Packages installed

- None

## Results

| Check | Result |
|---|---|
| Baseline measured | Pass (`edge_msp5nrdb_2sfe`, 53,962 ms) |
| Bottleneck identified | Pass (whisper_inference) |
| EXP-01–03 gated | Pass (all REJECTED with evidence) |
| EXP-06 gated | Pass (ACCEPTED lab) |
| Production Whisper knobs unchanged (threads/speedUp) | Pass |
| Production Whisper model promoted to tiny.en | Pass |
| Full trail + promotion documented | Pass |

## Safety / privacy

- Synthetic fixture only
- No health data / tokens / PINs logged
- No diagnose/prescribe behaviour added
- Transcript text not exported in evidence JSON (char count only)

## Known gaps

- Provisional quality = length proxy (not WER goldens)
- M4A decode still bundled inside `whisper_inference`
- WER goldens still future work

## Stop here

Do **not** auto-start public repo or licence pick.  
Reload Metro on device so production Voice-to-Care picks up the new manifest.

## Ask for approval

1. Accept this checkpoint (optimization + promotion complete)?  
2. Next: licence → public Arm repo → video/submit, or WER goldens first?
