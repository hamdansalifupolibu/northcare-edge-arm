# Promotion decision — EXP-06 Whisper Tiny English

**Decision date:** 2026-08-11  
**Decision:** **PROMOTE** lab-accepted `ggml-tiny.en.bin` into production Voice-to-Care  
**Authority:** Explicit human go-ahead (“do the best”) after quality-gated S20 Ultra evidence  
**Experiment:** `exp-06-smaller-whisper-conditional`  
**Evidence run:** `edge_msp6cf7n_d5qs`

## Why promote

| Gate | Result |
|---|---|
| Targeted latency (`whisper_inference`) | **−53.8%** (42,367 → 19,564 ms) |
| End-to-end | −50.9% (53,962 → 26,508 ms) |
| Provisional quality | −4 pts (within 5-point limit); chars 85→85 |
| Storage | ~148 MB → ~77 MB Whisper artifact |
| Rejected alternatives | EXP-01 threads, EXP-02 prompt, EXP-03 speedUp |

Config knobs alone did not clear the 5% gate. Model size did — with acceptable provisional quality.

## What changed in production

| Surface | Before (frozen baseline) | After promotion |
|---|---|---|
| `whisper-model-manifest.json` | `ggml-base.en.bin` | **`ggml-tiny.en.bin`** |
| modelId | `whisper-base-en-ggml` | `whisper-tiny-en-ggml` |
| SHA-256 / size | baseline values | `921e4cf8…` / 77,704,715 bytes |
| `WHISPER_TRANSCRIPTION_OPTIONS` | beam 1, threads 4, speedUp false | **unchanged** (rejected knobs stay off) |
| Edge Lab baseline freeze JSON | historical baseline | **unchanged** (starting line preserved) |

## What did not change

- Clinical Voice-to-Care confirm → SQLite flows  
- Qwen model / threads / GPU layers  
- Danger-sign engine / diagnose-prescribe rules  
- Edge Lab experiment harness (still can override lab-only)

## Device note

Provision `files/whisper/ggml-tiny.en.bin` (already pushed during EXP-06). Old `ggml-base.en.bin` may remain on disk unused; safe to delete later to reclaim storage.

## Rollback

Restore previous `whisper-model-manifest.json` contents from git history / `docs/arm/BASELINE_FREEZE.md` speech table and re-provision `ggml-base.en.bin`.

## Trail

Full story: [`BASELINE_TO_DONE_TRAIL.md`](./BASELINE_TO_DONE_TRAIL.md)
