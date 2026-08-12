# NorthCare Edge — Baseline freeze

**Frozen at:** 2026-08-11 (Phase 1)  
**Authority:** Application source code and manifests — **not** marketing README numbers  
**Machine-readable twin:** `apps/mobile/src/features/edge-lab/baseline/baselineConfig.json`

This document freezes the **current production Voice-to-Care / offline AI configuration** as the NorthCare Edge baseline.  
It is the starting line. It is **not** an optimization result.

Pipeline:

```text
M4A recording (expo-audio)
      ↓
Native Android decode (MediaExtractor / MediaCodec via whisper.rn patch)
      ↓
PCM 16 kHz mono float
      ↓
Whisper Base English (whisper.rn)
      ↓
Transcript (worker may edit)
      ↓
Qwen 2.5 0.5B Instruct Q4_K_M (llama.rn)
      ↓
Structured extraction → human review → SQLite
```

## Speech — Whisper

| Field | Frozen value | Source |
|---|---|---|
| Package | `whisper.rn` (declared `^0.2.1`, lock resolves `0.2.5`) | `apps/mobile/package.json` |
| Model id | `whisper-base-en-ggml` | `whisper-model-manifest.json` |
| Filename | `ggml-base.en.bin` | same |
| Size | 147,964,211 bytes (~141.1 MiB / ~148 MB) | same |
| SHA-256 | `a03779c86df3323075f5e796cb2ce5029f00ec8869eee3fdfb897afe36c6d002` | same |
| `beamSize` | **1** | `whisperTranscriptionOptions.ts` |
| `bestOf` | **1** | same |
| `maxThreads` | **4** | same |
| `temperature` | **0** | same |
| `speedUp` | **false** | same |
| Prompt | Community health worker recording patient case notes during home visit. | same |
| Backend | CPU | runtime usage |
| On-device dir | app documents `/whisper/` | `whisperModelManager.ts` |

**Important:** Some older README / plan text mentions `beamSize: 3`. That is **stale**. Code is authoritative: **beamSize = 1**.

## Language model — Qwen

| Field | Frozen value | Source |
|---|---|---|
| Package | `llama.rn` **0.12.8** | `apps/mobile/package.json` |
| Model id | `qwen2.5-0.5b-instruct-q4_k_m` | `offline-ai-model-manifest.json` |
| Filename | `qwen2.5-0.5b-instruct-q4_k_m.gguf` | same |
| Quantisation | **Q4_K_M** | same |
| Size | 491,400,032 bytes (~468.6 MiB / ~491 MB) | same |
| SHA-256 | `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db` | same |
| `n_ctx` | **2048** | manifest `configuredContextSize` |
| `n_predict` (max out) | **512** | manifest `configuredMaximumOutputTokens` |
| `n_threads` | **4** | `threadCount.ts` → `resolveOfflineAiThreadCount()` |
| `n_gpu_layers` | **0** | `offlineAiLifecycle.ts` |
| `temperature` | **0.1** | `offlineAiLifecycle.ts` `TEMPERATURE` |
| Acceleration | **cpu** | lifecycle + types |
| OpenCL / Hexagon | **disabled** | `app.config.ts` `enableOpenCLAndHexagon: false` |
| On-device dir | app documents `/offline-ai-models/` | offline-AI provisioning |

## Native audio decode

| Field | Frozen value | Source |
|---|---|---|
| Patch | `apps/mobile/patches/whisper.rn+0.2.5.patch` | patch-package postinstall |
| Path | M4A/AAC → MediaExtractor → MediaCodec → mono → 16 kHz → float PCM | patch / architecture docs |
| Apply | `npm` / `postinstall` → `npx patch-package` | `package.json` scripts |

## Target device (evidence host)

| Field | Value | Notes |
|---|---|---|
| Device | Samsung Galaxy S20 Ultra | Primary demo / evidence device |
| Model | `SM-G988B` | From Offline AI Stage 1 device result |
| Android | 13 (as captured in Stage 1) | Re-confirm at Phase 3 |
| Package | `com.northcareai.app` | Current app id |
| ABI / SoC / core counts | **Pending Arm evidence capture** | Do not invent; collect on-device in Phase 2–3 |

Historical Offline AI Stage 1 smoke timings (Qwen only, not full Voice-to-Care) exist in `docs/testing/OFFLINE_AI_STAGE_1_DEVICE_RESULT.md`. Those are **not** the Edge baseline Voice-to-Care end-to-end numbers. Edge baseline tables remain empty until Phase 3.

## What must not change without an Edge promotion decision

- Production Whisper options in `whisperTranscriptionOptions.ts`
- Production offline-AI thread count / lifecycle GPU layers / temperature
- Production extraction provider wiring used by Voice-to-Care confirm → SQLite
- Native `whisper.rn` patch behaviour (regressions break M4A transcription)

Lab experiments may **read** these values and **test alternate configs in isolation**. They may not silently overwrite them.

## Baseline performance / quality cells

First measured run on S20 Ultra: `edge_msp5nrdb_2sfe` (2026-08-11).  
Details: `benchmarks/baseline/s20-ultra-baseline-2026-08-11.md`

| Metric | Baseline | Optimized (lab EXP-06) | Improvement |
|---|---|---|---|
| M4A decode latency | bundled in transcribe | bundled in transcribe | — |
| Whisper load | 4,492 ms | 2,174 ms | −51.6% |
| Whisper inference (decode+infer) | 42,367 ms | 19,564 ms | **−53.8%** |
| Qwen load | 2,480 ms | 1,349 ms | (not experiment variable) |
| Qwen inference | 1,802 ms | 1,929 ms | (not experiment variable) |
| End-to-end pipeline | 53,962 ms | 26,508 ms | −50.9% |
| Peak memory | — | — | — |
| Model storage | ~148 MB + ~491 MB | ~77 MB + ~491 MB (lab) | Whisper −~48% |
| Tokens/sec | ~34.4 | ~34.3 | — |
| Temperature delta | — | — | — |
| Battery level change (observational) | — | — | — |
| Transcription quality | fixture 100 (`edge_mspb22j0_c9iy`) | fixture 100 (`edge_mspazssb_br9p`) | 0 |
| Extraction quality | keys 2/2 | keys 2/2 | 0 |

Optimized column = EXP-06 (`edge_msp6cf7n_d5qs`, `ggml-tiny.en.bin`).  
**Production promotion (2026-08-11):** Voice-to-Care now uses `ggml-tiny.en.bin` via `whisper-model-manifest.json`.  
This freeze document remains the **historical starting line** (`ggml-base.en.bin`).  
Promotion record: `docs/arm/PROMOTION_EXP06.md`. Trail: `docs/arm/BASELINE_TO_DONE_TRAIL.md`.
