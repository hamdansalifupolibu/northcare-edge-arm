# S20 Ultra — accepted lab optimization (EXP-06)

**Date:** 2026-08-11  
**Device:** Samsung Galaxy S20 Ultra (`SM-G988B`, Android 13, `arm64-v8a`)  
**Fixture:** `edge-lab-fixture-v1`  
**Accepted run:** `edge_msp6cf7n_d5qs`  
**Baseline run:** `edge_msp5nrdb_2sfe`

## Candidate config (lab)

| Field | Value |
|---|---|
| Whisper model | `ggml-tiny.en.bin` (~77 MB) |
| Threads / beam / speedUp | unchanged from freeze (4 / 1 / false) |
| Qwen | unchanged (2.5 0.5B Q4_K_M) |

## Measured

| Stage | Baseline | Accepted | Δ |
|---|---:|---:|---:|
| whisper_load | 4,492 ms | 2,174 ms | −51.6% |
| whisper_inference (decode+infer) | 42,367 ms | 19,564 ms | **−53.8%** |
| qwen_load | 2,480 ms | 1,349 ms | (not the experiment variable) |
| qwen_inference | 1,802 ms | 1,929 ms | (not the experiment variable) |
| total | 53,962 ms | 26,508 ms | −50.9% |

Provisional quality: 100 → 96 (transcript chars 85 → 85).

## Production status

**Promoted 2026-08-11** into `apps/mobile/src/features/voice/content/whisper-model-manifest.json`.  
See `docs/arm/PROMOTION_EXP06.md`. Historical freeze remains `ggml-base.en.bin`.
