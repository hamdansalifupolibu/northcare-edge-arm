# EXP-01 — Whisper thread sweep (4 → 6)

**Status:** REJECTED  
**Date:** 2026-08-11  
**Experiment id:** `exp-01-whisper-threads`

## Hypothesis

Increasing Whisper `maxThreads` from **4** to **6** on the S20 Ultra Arm64 CPU will reduce transcription latency without a significant provisional quality drop.

## Arm rationale

The S20 Ultra exposes a heterogeneous Arm CPU. Thread count must be measured: more threads can help Whisper, or can contend on little cores and hurt latency.

## One variable

| Knob | Baseline | Candidate |
|---|---|---|
| `maxThreads` | 4 | **6** |
| All other Whisper/Qwen knobs | unchanged | unchanged |

**Lab-only override.** Production `whisperTranscriptionOptions.ts` was **not** modified.

## Baseline reference (`edge_msp5nrdb_2sfe`)

| Metric | Value |
|---|---:|
| whisper_inference_ms | 42,367 |
| total_ms | 53,962 |
| transcriptCharCount | 85 |
| reference quality | 100 |

## Candidate run (`edge_msp5wxf5_ehhj`)

| Metric | Value |
|---|---:|
| whisperMaxThreads | 6 |
| whisper_load_ms | 3,590 |
| whisper_inference_ms | **72,816** |
| qwen_load_ms | 1,326 |
| qwen_inference_ms | 1,855 |
| total_ms | **82,022** |
| transcriptCharCount | 85 |
| provisional quality | **96** (length within 15% of baseline) |
| Raw | `benchmarks/raw/edge_msp5wxf5_ehhj.json` |

## Deltas vs baseline

| Metric | Delta | Relative |
|---|---:|---:|
| whisper_inference | +30,449 ms | **+71.9% slower** |
| total | +28,060 ms | **+52.0% slower** |
| quality | −4 points (100 → 96) | within 5-point limit |

## Quality gate

```text
Performance: FAILED (slower, not ≥5% faster)
Quality:     within provisional threshold
Verdict:     REJECTED
```

## Notes / confounders

- Second run of the evening — device may be warmer than the baseline run; still, a ~72% regression is large enough to reject 6 threads for this workload.
- Same transcript char count (85) suggests output length stability.

## Production promotion

**None.** Keep production `maxThreads: 4`.

## Next

Proceed to **EXP-02** (Whisper prompt length) — still targeting the Whisper bottleneck with a different single variable.
