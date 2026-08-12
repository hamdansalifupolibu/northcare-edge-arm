# Arm optimization — NorthCare Edge

**Status:** Measured on S20 Ultra (2026-08-11)  
**Audience:** Judges, reviewers, future contributors  
**Trail:** [BASELINE_TO_DONE_TRAIL.md](BASELINE_TO_DONE_TRAIL.md) · [PROMOTION_EXP06.md](PROMOTION_EXP06.md)

## One-sentence position

NorthCare Edge is a reproducible Arm optimization study embedded inside a real offline healthcare application, demonstrating how speech recognition and local LLM inference can be made faster and more resource-efficient on Arm-powered Android devices without sacrificing workflow quality or safety.

## Problem

Frontline Voice-to-Care already runs **two local models** on-device with **zero cloud inference** for the core path. On Arm Android phones, that pipeline is useful — but latency, memory, thermal behaviour, and model footprint determine whether workers can finish documentation in the field.

The competition question:

> How far can we push this AI pipeline on Arm hardware — measurably, under a quality constraint?

## What we optimize (in scope)

- Whisper transcription configuration and lifecycle (lab-gated)
- Qwen extraction configuration and lifecycle (lab-gated)
- Native M4A → PCM decode overhead (measure + document)
- Threading / loading strategy guided by **measured bottlenecks**
- Model artifact size when config knobs fail the gate

## What we do not rewrite

Existing NorthCare clinical product surfaces: clients, visits, screening, referrals, nutrition, USSD Reach, admin provisioning. Those remain the foundation.

## Arm evidence layer

| Field | Captured value |
|---|---|
| Device marketing name | Galaxy S20 Ultra |
| Model | SM-G988B |
| ABI | arm64-v8a |
| SoC / CPU | not exposed via JS — not invented |
| Runtime packages | whisper.rn / llama.rn |
| Threads used (promoted) | Whisper 4 · Qwen 4 |
| Backend | CPU |
| Config hash (freeze) | `cfg_53e659c2` |

## Results (measured)

| Metric | Baseline | Optimized (promoted) | Δ |
|---|---:|---:|---:|
| whisper_inference | 42,367 ms | 19,564 ms | **−53.8%** |
| End-to-end | 53,962 ms | 26,508 ms | −50.9% |
| Whisper storage | ~148 MB | ~77 MB | −~48% |
| Provisional quality | 100 | 96 | −4 (pass) |

Accepted change: `ggml-base.en.bin` → `ggml-tiny.en.bin` after rejecting threads/prompt/speedUp.

## Related

- [BENCHMARK_METHODOLOGY.md](BENCHMARK_METHODOLOGY.md)
- [MODEL_OPTIMIZATION.md](MODEL_OPTIMIZATION.md)
- [OPTIMIZATION_TIMELINE.md](OPTIMIZATION_TIMELINE.md)
- [QUALITY_GATE.md](QUALITY_GATE.md)
