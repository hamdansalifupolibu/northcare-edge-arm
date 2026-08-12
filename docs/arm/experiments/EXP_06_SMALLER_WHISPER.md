# EXP-06 — Smaller Whisper model (`ggml-tiny.en.bin`)

**Status:** ACCEPTED + PROMOTED  
**Date:** 2026-08-11  
**Experiment id:** `exp-06-smaller-whisper-conditional`  
**Promotion:** [`../PROMOTION_EXP06.md`](../PROMOTION_EXP06.md)

## Hypothesis

After thread / prompt / speedUp knobs failed to move the primary bottleneck, a smaller Whisper English artifact (`ggml-tiny.en.bin`, ~77 MB) will cut `whisper_inference` latency on Arm while keeping provisional transcript-length quality within the gate.

## Arm rationale

Model size drives Arm memory pressure, disk footprint, and decode+infer work. Mid-range phones benefit when a smaller model still produces usable clinical-note drafts for worker review.

## One variable

| Knob | Baseline | Candidate |
|---|---|---|
| Whisper model filename | `ggml-base.en.bin` (~148 MB) | **`ggml-tiny.en.bin` (~77 MB)** |
| `maxThreads` | 4 | 4 |
| `prompt` | baseline prompt | unchanged |
| `speedUp` | false | false |

**Lab-only override** via `edge-lab-auto-run.config` → `whisperModelFilename`.  
Production `whisperTranscriptionOptions.ts` / model manifest **not** modified.

## Baseline reference (`edge_msp5nrdb_2sfe`)

| Metric | Value |
|---|---:|
| whisper_load_ms | 4,492 |
| whisper_inference_ms | 42,367 |
| total_ms | 53,962 |
| transcriptCharCount | 85 |
| reference quality | 100 |

## Candidate run (`edge_msp6cf7n_d5qs`)

| Metric | Value |
|---|---:|
| whisperModelFilename | `ggml-tiny.en.bin` |
| whisper_load_ms | 2,174 |
| whisper_inference_ms | **19,564** |
| qwen_load_ms | 1,349 |
| qwen_inference_ms | 1,929 |
| total_ms | **26,508** |
| tok/s | ~34.3 |
| transcriptCharCount | 85 |
| provisional quality | **96** (length within 15% of baseline) |
| Raw | `benchmarks/raw/edge_msp6cf7n_d5qs.json` |

## Deltas vs baseline

| Metric | Delta | Relative |
|---|---:|---:|
| whisper_inference | −22,803 ms | **−53.8%** |
| whisper_load | −2,318 ms | −51.6% |
| total | −27,454 ms | −50.9% |
| quality | −4 points (100 → 96) | within 5-point limit |
| model storage (Whisper) | ~148 MB → ~77 MB | −~48% |

## Quality gate

```text
Targeted whisper_inference improvement ≥5%  → PASS (−53.8%)
Quality drop ≤5 points (provisional)         → PASS (−4)
Verdict:                                     ACCEPTED (lab)
```

## Notes / confounders

- `whisper_inference` still bundles native M4A decode; tiny model does not separate decode vs infer in JS.
- Provisional quality is length-stability only — not WER. Fixture goldens remain a follow-up.
- Cool-down (~40 s) applied before auto-run; still a single-run evening session.

## Production promotion

**Promoted 2026-08-11** after human go-ahead.

- Production manifest → `ggml-tiny.en.bin` (`whisper-tiny-en-ggml`)
- Transcription knobs unchanged (threads 4, speedUp false, baseline prompt)
- Historical Edge baseline freeze left on `ggml-base.en.bin`

## Next

Optional WER goldens, public Arm repo / video / submission (licence first).
