# NorthCare Edge — Baseline → done trail

**Device evidence host:** Samsung Galaxy S20 Ultra (`SM-G988B`, Android 13, `arm64-v8a`)  
**Freeze id:** `northcare-edge-baseline-2026-08-11`  
**Fixture:** `edge-lab-fixture-v1` (261,181 bytes)  
**Rule:** Every number below comes from `[EDGE_LAB_EVIDENCE]` logcat or frozen code — nothing invented.

This is the single narrative of what we froze, measured, tried, rejected, and accepted.

---

## 0. Philosophy

```text
Freeze → measure → optimize → prove → visualize → document → submit
```

NorthCare Edge is an **optimization layer** around existing offline Voice-to-Care — not a new clinical app. Lab configs must not silently replace production.

---

## 1. Phase 1 — Freeze (complete)

Frozen production config (code-sourced):

| Component | Frozen value |
|---|---|
| Whisper | `ggml-base.en.bin` ~148 MB, beam **1**, threads **4**, `speedUp: false` |
| Qwen | 2.5 0.5B Q4_K_M ~491 MB, threads **4**, n_ctx 2048, GPU layers 0 |
| Package | `com.northcareai.app` |
| Pipeline | M4A → native decode → Whisper → Qwen → worker review → SQLite |

Docs: `docs/arm/BASELINE_FREEZE.md`, `apps/mobile/src/features/edge-lab/baseline/baselineConfig.json`

---

## 2. Phase 2 — Instrumentation (complete)

Edge Lab harness under `apps/mobile/src/features/edge-lab/`:

- Routes: `/(development)/edge-lab` (+ compare, experiments, timeline, export)
- Stages: `whisper_load`, `whisper_inference` (**includes M4A decode**), `qwen_load`, `qwen_inference`, `total`
- Evidence tag: `[EDGE_LAB_EVIDENCE]`
- Lab overrides via `files/edge-lab-auto-run.config` + trigger file
- More → Edge Lab when diagnostics / non-production

Note: `m4a_decode` is not separable in JS until a native timing split exists.

---

## 3. Phase 3 — Baseline measurement (complete)

| Field | Value |
|---|---|
| Run id | `edge_msp5nrdb_2sfe` |
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

## 4. Phase 4 — Bottleneck (complete)

**Primary bottleneck:** `whisper_inference` ≈ **82.8%** of measured stage time.

Decision: first optimizations target Whisper, one variable at a time, under the quality gate.

---

## 5. Experiments (Phases 5–7)

Gate: ≥5% improvement on **targeted** stage (`whisper_inference`) **and** provisional quality drop ≤5 points (length proxy vs baseline chars).

| Exp | Variable | Run | whisper_inference | Quality | Verdict | Doc |
|---|---|---|---:|---:|---|---|
| EXP-01 | threads 4→**6** | `edge_msp5wxf5_ehhj` | 72,816 ms (**+71.9%**) | 96 | **REJECTED** | `experiments/EXP_01_WHISPER_THREADS.md` |
| EXP-02 | prompt → `""` | `edge_msp61xyw_bzmw` | 42,062 ms (−0.72%) | 96 | **REJECTED** | `experiments/EXP_02_WHISPER_PROMPT.md` |
| EXP-03 | `speedUp: true` | `edge_msp670iy_7lfm` | 42,025 ms (−0.81%) | 96 | **REJECTED** | `experiments/EXP_03_WHISPER_SPEEDUP.md` |
| EXP-06 | model → **tiny.en** | `edge_msp6cf7n_d5qs` | **19,564 ms (−53.8%)** | 96 | **ACCEPTED (lab)** | `experiments/EXP_06_SMALLER_WHISPER.md` |

### Honest story

Config knobs alone (threads, prompt, speedUp) did **not** unlock a ≥5% win on the Whisper bottleneck.  
Reducing the Whisper artifact size (`base.en` → `tiny.en`) delivered a large, gate-passing latency win with stable provisional length quality.

Catalog items not yet measured on this device (Qwen prompt compaction, Qwen threads, model lifecycle) remain planned — Whisper was the measured bottleneck, so they were deprioritized.

---

## 6. Accepted lab result (done for optimization loop)

| Metric | Baseline | Accepted (EXP-06) | Improvement |
|---|---:|---:|---:|
| whisper_inference | 42,367 ms | 19,564 ms | **−53.8%** |
| End-to-end total | 53,962 ms | 26,508 ms | −50.9% |
| Whisper storage | ~148 MB | ~77 MB | −~48% |

Summary: `benchmarks/optimized/s20-ultra-accepted-exp06-2026-08-11.md`

### Production promotion status

| Surface | Model |
|---|---|
| Edge Lab accepted candidate | `ggml-tiny.en.bin` |
| Production Voice-to-Care | **`ggml-tiny.en.bin` (promoted 2026-08-11)** |
| Historical freeze (Phase 1) | `ggml-base.en.bin` (unchanged in baselineConfig) |

Promotion record: [`PROMOTION_EXP06.md`](./PROMOTION_EXP06.md).

---

## 7. Fixture accuracy scoring (complete)

| Model | Run | Score | Phrases | Extraction keys |
|---|---|---:|---|---|
| base.en | `edge_mspb22j0_c9iy` | **100/100** | 4/4 | 2/2 |
| tiny.en | `edge_mspazssb_br9p` | **100/100** | 4/4 | 2/2 |

Method: `fixture_combined_v1` (70% phrase/token transcription + 30% extraction keys).  
Golden: synthetic note — child 2 years, diarrhea since yesterday, not feeding well.

## 8. What remains after this trail (not auto-started)

1. Optional native decode/infer timing split  
2. Licence decision, public Arm repo, video, submission  
3. Optional root README replace from `NORTHCARE_EDGE_README_SKELETON.md`  

---

## 8. Evidence index

| Artifact | Path |
|---|---|
| Baseline raw | `benchmarks/raw/edge_msp5nrdb_2sfe.json` |
| EXP-01 raw | `benchmarks/raw/edge_msp5wxf5_ehhj.json` |
| EXP-02 raw | `benchmarks/raw/edge_msp61xyw_bzmw.json` |
| EXP-03 raw | `benchmarks/raw/edge_msp670iy_7lfm.json` |
| EXP-06 raw | `benchmarks/raw/edge_msp6cf7n_d5qs.json` |
| Experiment log | `docs/arm/EXPERIMENT_LOG.md` |
| Timeline | `docs/arm/OPTIMIZATION_TIMELINE.md` |
| Quality gate | `docs/arm/QUALITY_GATE.md` |
| Device runbook | `docs/arm/DEVICE_RUNBOOK.md` |
