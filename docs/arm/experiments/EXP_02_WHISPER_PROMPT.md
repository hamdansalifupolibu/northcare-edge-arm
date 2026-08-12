# EXP-02 — Whisper prompt length (baseline → empty)

**Status:** REJECTED  
**Date:** 2026-08-11  
**Experiment id:** `exp-02-whisper-prompt-length`

## Hypothesis

Removing the Whisper initial prompt reduces on-device transcription latency on Arm without collapsing provisional transcript-length quality.

## One variable

| Knob | Baseline | Candidate |
|---|---|---|
| `prompt` | 69 chars | **""** (0 chars) |
| `maxThreads` | 4 | 4 |

## Candidate run (`edge_msp61xyw_bzmw`)

| Metric | Baseline | Candidate | Δ |
|---|---:|---:|---:|
| whisper_inference_ms | 42,367 | 42,062 | **−0.72%** |
| total_ms | 53,962 | 50,990 | −5.51% |
| transcriptCharCount | 85 | 85 | 0 |
| provisional quality | 100 | 96 | −4 |

Raw: `benchmarks/raw/edge_msp61xyw_bzmw.json`

## Gate (targeted stage = whisper_inference)

```text
Targeted performance: FAILED (<5% improvement on whisper_inference)
Quality: within provisional threshold
Verdict: REJECTED
```

## Honesty note

Wall-clock total improved ~5.5%, but that was largely **model load variance** (Whisper/Qwen load also faster), not a clear prompt effect on the bottleneck stage. We do **not** accept optimizations that only look good on confounded totals.

## Production promotion

**None.**
