# EXP-03 — Whisper speedUp flag

**Status:** REJECTED  
**Date:** 2026-08-11  
**Experiment id:** `exp-03-whisper-speedup`

## Hypothesis

Enabling whisper.rn `speedUp: true` reduces transcription latency on Arm without large provisional quality loss.

## One variable

| Knob | Baseline | Candidate |
|---|---|---|
| `speedUp` | false | **true** |

## Candidate (`edge_msp670iy_7lfm`)

| Metric | Baseline | Candidate | Δ |
|---|---:|---:|---:|
| whisper_inference_ms | 42,367 | 42,025 | **−0.81%** |
| total_ms | 53,962 | 51,530 | −4.5% |
| transcriptCharCount | 85 | 87 | +2 |
| provisional quality | 100 | 96 | −4 |

Raw: `benchmarks/raw/edge_msp670iy_7lfm.json`

## Gate

```text
Targeted whisper_inference improvement <5% → REJECTED
Quality within provisional threshold
```

## Production promotion

**None.** Keep `speedUp: false`.
