# NorthCare Edge

### Arm-optimized offline voice intelligence for frontline healthcare

**One Arm phone. Two local AI models. Zero cloud inference in the AI pipeline.**

> Speech recognition, structured extraction, Ask NorthCare, and offline referral QR verification are designed to run **on the Arm device**. Clinical Voice-to-Care work does not wait on the cloud.

**Author:** [Hamdan Salifu Polibu](https://github.com/hamdansalifupolibu)  
BSc Computer Science & Engineering · University of Mines and Technology (UMAT)  
**Track:** Arm AI Optimization Challenge 2026 — Mobile AI  

---

## The story

In Northern Ghana, a home visit does not pause for a weak signal. **NorthCare Edge** is an Arm-focused optimization of an Android-first, offline-first care app for authorised frontline health workers.

Workers document visits by voice (**Voice-to-Care**), confirm AI-extracted fields before anything is saved, hand off urgent cases with a **signed offline QR referral passport**, and use an **on-device** assistant — without requiring cloud inference for the AI path.

This repository is the competition release: **freeze → measure → reject failed knobs → ship the winner → prove it in Edge Lab** on a real Galaxy S20 Ultra (`arm64-v8a`).

---

## Target device (Arm evidence host)

| Field | Value |
|---|---|
| Device | Samsung Galaxy S20 Ultra |
| Model | `SM-G988B` |
| ABI | **arm64-v8a** |
| Execution | **CPU** (`whisper.rn` / `llama.rn`) |
| Threads (shipped) | Whisper **4** · Qwen **4** |
| Acceleration | No GPU / OpenCL / Hexagon layers in the shipped config |

### Optimization target

```text
Whisper ggml-base.en.bin  (147,964,211 bytes ≈ 148 MB)
        ↓  accepted after quality gate
Whisper ggml-tiny.en.bin  (77,704,715 bytes ≈ 77.7 MB)

Why on Arm mobile:
• lower memory footprint
• lower compute workload
• lower latency on the target Arm64 CPU
• fixture quality held (see below)
```

---

## Measured results (Samsung Galaxy S20 Ultra)

All timings from Edge Lab wall-clock stages on the same device and synthetic fixture.  
**Whisper transcription** = one `transcribe()` call that includes native M4A decode + Whisper infer (not separable in JS today).

| Metric | Baseline | NorthCare Edge | Result |
|---|---:|---:|---:|
| Whisper transcription (decode + inference) | 42,367 ms (42.4 s) | **19,564 ms (19.6 s)** | **53.8% faster** |
| End-to-end AI pipeline | 53,962 ms (54.0 s) | **26,508 ms (26.5 s)** | **50.9% faster** |
| Whisper model size | 147,964,211 B (~148 MB) | **77,704,715 B (~77.7 MB)** | **47.5% smaller** |
| Synthetic fixture quality | 100/100 | **100/100** | **No observed regression** |

Size reduction uses exact byte sizes: `(147964211 − 77704715) / 147964211 = 47.5%`.  
Latency deltas use exact ms from raw JSON (not rounded intermediates).

**Quality fixture:** 100/100 means the run matched the fixed synthetic benchmark phrases (`2 years`, `diarrhea`, `yesterday`, `feeding`) and required extraction keys (`symptomSummary`, `urgencyLevel`). Method: `fixture_combined_v1` in [`docs/arm/QUALITY_GATE.md`](docs/arm/QUALITY_GATE.md). This is a **regression fixture**, not a clinical accuracy study.

Evidence runs: `edge_msp5nrdb_2sfe` (baseline) · `edge_msp6cf7n_d5qs` (accepted) · `edge_mspazssb_br9p` (tiny.en quality verify, phrases 4/4 + keys 2/2).  
Raw JSON: [`benchmarks/raw/`](benchmarks/raw/) · Trail: [`docs/arm/BASELINE_TO_DONE_TRAIL.md`](docs/arm/BASELINE_TO_DONE_TRAIL.md)

### Why Whisper was the target (baseline profile)

Same device, same synthetic fixture (`edge_msp5nrdb_2sfe`). Shares are **of end-to-end total (53,962 ms)** so rows sum to 100%.

| Stage | Baseline | Share of end-to-end |
|---|---:|---:|
| Whisper load | 4,492 ms (4.5 s) | 8.3% |
| **Whisper transcription (decode + inference)** | **42,367 ms (42.4 s)** | **78.5%** |
| Qwen load | 2,480 ms (2.5 s) | 4.6% |
| Qwen inference | 1,802 ms (1.8 s) | 3.3% |
| Other / harness overhead | 2,821 ms (2.8 s) | 5.2% |
| **End-to-end total** | **53,962 ms (54.0 s)** | **100%** |

Profiling chose the optimization — Tiny was not a random model swap. Whisper transcription alone was **78.5%** of end-to-end wall time (and **82.8%** of the four timed AI stages excluding overhead).

---

## Why this matters on Arm

Mobile AI is constrained by compute, memory, thermal behaviour, and battery. NorthCare Edge treats **model size** and **transcription latency** as first-class deployment constraints — not only output quality.

On the Galaxy S20 Ultra (`arm64-v8a`, CPU backend), the accepted change cut the speech artifact from **147,964,211 → 77,704,715 bytes** and cut Whisper transcription from **42.4 s → 19.6 s**, while the synthetic fixture score stayed **100/100**.

Baseline and optimized runs use the **same device and workload**, so the result is a real deployment change — not a theoretical model comparison on a desktop GPU.

---

## Demo video

Edge Lab walkthrough on device — pick whichever player you prefer:

- **[YouTube Short](https://youtube.com/shorts/oTjXKXVU9uo)** — public Devpost-friendly copy  
- **[OneDrive](https://1drv.ms/v/c/a6e600124ed58265/IQBUCYZsUx9NRqeHDfu7wqReAX8g8ULShqJiiKOHG-2q_Kc)** — same demo, alternate host

Please be patient while a live benchmark runs (~**20–55 seconds** on-device depending on model and temperature). Stage bars update during the run.

---

## Edge Lab — optimization proof

In the app: **More → Edge Lab** (development / diagnostics build).

| Published win on device | Before → After |
|:---:|:---:|
| ![Results — live optimized run](benchmarks/reports/edge-lab/01-results-live-optimized.jpg) | ![Compare — published evidence](benchmarks/reports/edge-lab/04-compare-published-before-after.jpg) |
| −53.8% Whisper transcription · live bars · fixture 100/100 | base.en → tiny.en shipped · quality held |

| Honest experiments | Engineering story |
|:---:|:---:|
| ![Experiments — rejected knobs](benchmarks/reports/edge-lab/06-experiments-rejected-honest.jpg) | ![Story — phases](benchmarks/reports/edge-lab/08-story-phases.jpg) |
| Failed knobs stay visible — no cherry-picking | Freeze → measure → reject → accept → ship |

**Why “REJECTED” is good:** config knobs were tried first and failed the ≥5% gate (or made things worse). Only `tiny.en` cleared latency **and** fixture quality, then shipped into production Voice-to-Care.  
Guide: [`docs/arm/MEDIA_PACK.md`](docs/arm/MEDIA_PACK.md)

---

## How we optimized

```text
Freeze baseline → Measure S20 Ultra
→ Find bottleneck (Whisper transcription = 78.5% of end-to-end)
→ One-variable experiments → Quality gate → Ship tiny.en
```

| Experiment | Change | Verdict |
|---|---|---|
| EXP-01 | Whisper threads 4→6 | **REJECTED** (~72% slower transcription) |
| EXP-02 | Empty prompt | **REJECTED** (<5% gate on transcription) |
| EXP-03 | `speedUp: true` | **REJECTED** (<5% gate on transcription) |
| EXP-06 | `ggml-tiny.en.bin` | **ACCEPTED + SHIPPED** (−53.8% transcription) |

More threads was **not** assumed better on this Arm phone — EXP-01 proved oversubscription can hurt. Details: [`docs/arm/EXPERIMENT_LOG.md`](docs/arm/EXPERIMENT_LOG.md) · [`docs/arm/PROMOTION_EXP06.md`](docs/arm/PROMOTION_EXP06.md) · [`docs/arm/QUALITY_GATE.md`](docs/arm/QUALITY_GATE.md)

### Qwen — retained on purpose

| Model | Status | Reason |
|---|---|---|
| **Qwen 2.5 0.5B Instruct Q4_K_M** | **Retained (baseline)** | Only **3.3%** of end-to-end baseline time (1,802 / 53,962 ms) |
| Optimization decision | No unnecessary change | Changing Qwen would not address the Whisper-bound Voice-to-Care path |

Qwen remains fully on-device. Optimization does not mean changing every model.

---

## Pipeline (on-device AI path)

```text
M4A → native MediaCodec decode → Whisper (on-device)
    → transcript (worker may edit) → Qwen extract (on-device)
    → human confirm → SQLite
```

Edge Lab times AI stages without clinical SQLite apply. Production Voice-to-Care always requires worker confirmation.

---

## Product context (secondary to the Arm optimization)

These screens show that the optimization sits inside a real offline care workflow — not a toy bench.

| Voice-to-Care (worker confirms) | Offline referral QR passport |
|:---:|:---:|
| ![Voice-to-Care confirm](benchmarks/reports/product/11-voice-to-care-confirm.jpg) | ![Offline QR](benchmarks/reports/product/12-offline-referral-qr.jpg) |
| On-device Whisper + Qwen · human-in-the-loop | Signed minimal summary · offline verify |

| Ask NorthCare (on-device) | Worker home |
|:---:|:---:|
| ![Ask NorthCare](benchmarks/reports/product/13-ask-northcare-on-device.jpg) | ![Worker home](benchmarks/reports/product/15-worker-home.jpg) |
| Visible **On-device** badge | Offline-first field workspace |

**Offline QR:** when a caregiver moves between facilities without network, a signed QR passport carries a minimal handoff the receiving NorthCare phone can check offline — continuity without waiting for sync.

---

## Reproduce

1. Android development build on an Arm64 device (evidence host: Galaxy S20 Ultra).  
2. Provision Whisper `ggml-tiny.en.bin` + Qwen 2.5 0.5B Q4_K_M (weights not in git).  
3. **More → Edge Lab** → import synthetic fixture → **Run benchmark**.  
4. Compare against `benchmarks/` and `docs/arm/`.

Checklist: [`docs/arm/DEVICE_RUNBOOK.md`](docs/arm/DEVICE_RUNBOOK.md)

---

## Safety

- No diagnose / prescribe / dosage  
- No AI save without worker confirmation  
- Deterministic danger-sign rules are not replaced by the LLM  
- Synthetic fixtures only in Edge Lab evidence  
- Not a certified medical device  

---

## Licence

MIT — [`LICENSE`](LICENSE). Third-party model / map notices: [`NOTICE`](NOTICE).

---

## Author

**Hamdan Salifu Polibu** — author and sole listed contributor of this Arm competition repository.  
GitHub: [hamdansalifupolibu](https://github.com/hamdansalifupolibu)
