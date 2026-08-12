# NorthCare Edge — Experiment log

**Device:** Samsung Galaxy S20 Ultra (`SM-G988B`, Android 13, `arm64-v8a`)  
**Fixture:** `edge-lab-fixture-v1`  
**Freeze:** `northcare-edge-baseline-2026-08-11`  
**Rule:** Document every measured step. Never invent numbers.  
**Full narrative:** [`BASELINE_TO_DONE_TRAIL.md`](./BASELINE_TO_DONE_TRAIL.md)

---

## Phase 3 — Baseline (complete)

| Field | Value |
|---|---|
| Date | 2026-08-11 |
| Run id | `edge_msp5nrdb_2sfe` |
| Config | Whisper threads **4**, beam 1; Qwen threads 4 |
| Total | **53,962 ms** |
| Whisper load | 4,492 ms |
| Transcribe (decode+infer) | **42,367 ms** |
| Qwen load | 2,480 ms |
| Qwen inference | 1,802 ms |
| tok/s | ~34.4 |
| Transcript chars | 85 |
| Raw | `benchmarks/raw/edge_msp5nrdb_2sfe.json` |
| Summary | `benchmarks/baseline/s20-ultra-baseline-2026-08-11.md` |

---

## Phase 4 — Bottleneck (complete)

**Primary bottleneck:** `whisper_inference` (M4A decode + Whisper infer) ≈ **82.8%** of measured stage time.

Decision: one-variable Whisper experiments first; smaller model only after config knobs.

---

## EXP-01 — Whisper threads 4 → 6 — REJECTED

See `experiments/EXP_01_WHISPER_THREADS.md`.

| Field | Value |
|---|---|
| Run | `edge_msp5wxf5_ehhj` |
| whisper_inference | 72,816 ms (**+71.9%** vs baseline) |
| total | 82,022 ms |
| provisional quality | 96 |
| Production changed? | **No** |

---

## EXP-02 — Whisper prompt → empty — REJECTED

See `experiments/EXP_02_WHISPER_PROMPT.md`.

| Field | Value |
|---|---|
| Run | `edge_msp61xyw_bzmw` |
| whisper_inference | 42,062 ms (−0.72%) |
| total | 50,990 ms (load variance; targeted stage failed gate) |
| provisional quality | 96 |
| Production changed? | **No** |

---

## EXP-03 — Whisper speedUp true — REJECTED

See `experiments/EXP_03_WHISPER_SPEEDUP.md`.

| Field | Value |
|---|---|
| Run | `edge_msp670iy_7lfm` |
| whisper_inference | 42,025 ms (−0.81%) |
| total | 51,530 ms |
| provisional quality | 96 |
| Production changed? | **No** |

---

## EXP-06 — Smaller Whisper (`ggml-tiny.en.bin`) — ACCEPTED (lab)

See `experiments/EXP_06_SMALLER_WHISPER.md`.

| Field | Value |
|---|---|
| Run | `edge_msp6cf7n_d5qs` |
| whisper_inference | **19,564 ms (−53.8%)** |
| total | **26,508 ms (−50.9%)** |
| transcript chars | 85 (unchanged) |
| provisional quality | 96 |
| Optimized summary | `benchmarks/optimized/s20-ultra-accepted-exp06-2026-08-11.md` |
| Production changed? | **Yes (2026-08-11)** — see `PROMOTION_EXP06.md` |

---

## Optimization loop status

**Done:** freeze → baseline → three rejected knobs → accepted smaller model → **promoted to production**.

Production Voice-to-Care uses `ggml-tiny.en.bin`. Historical freeze stays `ggml-base.en.bin` in `BASELINE_FREEZE.md` / `baselineConfig.json`.
