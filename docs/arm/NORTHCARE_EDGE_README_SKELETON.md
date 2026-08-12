# NorthCare Edge — README skeleton (for future public repo)

**Status:** Filled from S20 Ultra evidence (2026-08-11). Root product README still not replaced until public-repo phase.  
**Evidence:** `docs/arm/BASELINE_TO_DONE_TRAIL.md`, `benchmarks/`

---

# NorthCare Edge

### Arm-Optimized Offline Voice Intelligence for Frontline Healthcare

> NorthCare Edge is an Arm-focused optimization release derived from the previously developed **NorthCare AI** platform. The competition work focuses specifically on optimizing and benchmarking its on-device speech and language-model pipeline on Arm-powered Android hardware.

**One Arm phone. Two local AI models. Zero cloud inference.**

## The Arm optimization problem

Frontline workers in Northern Ghana need Voice-to-Care to finish on-device when connectivity fails. We ask:

> How far can we push Whisper + Qwen on Arm Android — measurably — without sacrificing quality or safety?

## What we optimized

- Identified Whisper decode+infer as ~83% of measured pipeline time on S20 Ultra  
- Rejected thread / prompt / speedUp knobs that failed the ≥5% gate  
- Promoted smaller Whisper English model (`ggml-tiny.en.bin`) after quality-gated accept  
- Left Qwen 0.5B Q4_K_M and clinical confirm→SQLite path unchanged  

## Before → After

| Metric | Baseline | NorthCare Edge | Improvement |
|---|---:|---:|---:|
| Transcription (decode+infer) | 42,367 ms | 19,564 ms | **−53.8%** |
| Qwen extraction | 1,802 ms | 1,929 ms | n/a (not the accepted variable) |
| End-to-end | 53,962 ms | 26,508 ms | −50.9% |
| Peak RAM | — | — | — |
| Whisper model storage | ~148 MB | ~77 MB | −~48% |
| Tokens/sec | ~34.4 | ~34.3 | — |
| Temperature Δ | — | — | — |
| Quality (provisional) | 100 | 96 | −4 (within gate) |

Runs: baseline `edge_msp5nrdb_2sfe` · accepted `edge_msp6cf7n_d5qs`.

## AI pipeline

```text
M4A → MediaCodec decode → Whisper → transcript → Qwen extract → human review → SQLite
```

Lab harness skips clinical SQLite apply; production Voice-to-Care keeps worker confirmation.

## Arm device

| Field | Value |
|---|---|
| Device | Samsung Galaxy S20 Ultra |
| Model | SM-G988B |
| ABI | arm64-v8a |
| SoC | — (not exposed via JS; do not invent) |
| Backend | CPU |

## Models

| Model | Artifact | Size | Config |
|---|---|---:|---|
| Whisper (promoted) | ggml-tiny.en.bin | ~77 MB | beam 1, threads 4, speedUp false |
| Whisper (frozen baseline) | ggml-base.en.bin | ~148 MB | same knobs — historical starting line |
| Qwen | 2.5 0.5B Instruct Q4_K_M | ~491 MB | n_ctx 2048, threads 4, GPU layers 0 |

## Optimization experiments

| Exp | Variable | Verdict |
|---|---|---|
| EXP-01 | Whisper threads 4→6 | REJECTED (+71.9% slower) |
| EXP-02 | Whisper prompt → empty | REJECTED (−0.72% < 5% gate) |
| EXP-03 | Whisper speedUp true | REJECTED (−0.81% < 5% gate) |
| EXP-06 | Smaller Whisper tiny.en | **ACCEPTED + PROMOTED** |

See `docs/arm/EXPERIMENTS_CATALOG.md`, `EXPERIMENT_LOG.md`, `PROMOTION_EXP06.md`.

## Benchmark methodology

See `docs/arm/BENCHMARK_METHODOLOGY.md` and `QUALITY_GATE.md`.

## Edge Lab

Development: `/(development)/edge-lab`  
Also: discreet **More → Edge Lab** when diagnostics / non-production.

## Native Android engineering

See `docs/arm/NATIVE_ANDROID_ENGINEERING.md`.

## Reproducibility

See `docs/arm/REPRODUCIBILITY.md` and `DEVICE_RUNBOOK.md`.

## Architecture

See `docs/arm/EDGE_LAB_ARCHITECTURE.md`.

## Quality & safety

- No diagnose / prescribe  
- No AI save without worker confirmation (production path)  
- Deterministic danger-sign engine remains non-LLM  
- Synthetic fixtures only  

## Existing NorthCare foundation

NorthCare AI clinical product (clients, visits, screening, nutrition, referrals, Reach USSD, admin) is the foundation. Edge adds the optimization lab — it does not rewrite the health app.

## Screenshots

_(Add Edge Lab captures after device session)_

## Installation / model setup

Provision Whisper `ggml-tiny.en.bin` and Qwen `qwen2.5-0.5b-instruct-q4_k_m.gguf` into app documents (see `DEVICE_RUNBOOK.md` and existing offline-AI provisioning docs).

## Results

Populate judges’ tables from `benchmarks/baseline/` and `benchmarks/optimized/`.

## Limitations

- Decode vs Whisper infer not split in JS yet  
- Battery % is observational  
- Fixture quality uses phrase match + extraction keys (`fixture_combined_v1`); not full clinical WER  
- Not production-certified clinical software  
- Licence for public repo: resolve via `docs/development/LICENSING_DECISION.md` before publish  

## Team & attribution

Preserve NorthCare AI team attribution; clearly separate foundation vs new Arm optimization work.

## Licence

TBD before public competition repository (see locked decisions).

## Submitted to

Arm AI Optimization Challenge 2026
