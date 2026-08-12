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
Whisper ggml-base.en.bin (~148 MB)
        ↓  accepted after quality gate
Whisper ggml-tiny.en.bin (~77 MB)

Why on Arm mobile:
• lower memory footprint
• lower compute workload
• lower latency on the target Arm64 CPU
• fixture quality held (see below)
```

---

## Measured results (Samsung Galaxy S20 Ultra)

| Metric | Baseline | NorthCare Edge | Result |
|---|---:|---:|---:|
| Whisper decode + inference | 42.4 s | **19.6 s** | **53.8% faster** |
| End-to-end AI pipeline | 54.0 s | **26.5 s** | **50.9% faster** |
| Whisper model size | ~148 MB (`base.en`) | **~77 MB** (`tiny.en`) | **47.5% smaller** |
| Synthetic fixture quality | 100/100 | **100/100** | **No observed regression** |

**Quality fixture:** 100/100 means the run matched the fixed synthetic benchmark phrases and required extraction keys (`symptomSummary`, `urgencyLevel`). This is a **regression fixture**, not a clinical accuracy study or medical validation.

Evidence runs: `edge_msp5nrdb_2sfe` (baseline) · `edge_msp6cf7n_d5qs` (accepted) · `edge_mspazssb_br9p` (tiny.en quality verify).  
Raw JSON: [`benchmarks/raw/`](benchmarks/raw/) · Full trail: [`docs/arm/BASELINE_TO_DONE_TRAIL.md`](docs/arm/BASELINE_TO_DONE_TRAIL.md)

### Why Whisper was the target (baseline profile)

Same device, same synthetic fixture. Decode is bundled inside Whisper transcribe in the current JS timing split.

| Stage | Baseline | Share of measured stages |
|---|---:|---:|
| Whisper load | 4.5 s | 8.8% |
| **Whisper inference (decode+infer)** | **42.4 s** | **~82.8%** |
| Qwen load | 2.5 s | 4.8% |
| Qwen inference | 1.8 s | 3.5% |
| **End-to-end total** | **54.0 s** | |

Profiling chose the optimization — Tiny was not a random model swap.

---

## Why this matters on Arm

Mobile AI is constrained by compute, memory, thermal behaviour, and battery. NorthCare Edge treats **model size** and **inference latency** as first-class deployment constraints — not only output quality.

On the Galaxy S20 Ultra (`arm64-v8a`, CPU backend), the accepted change cut the speech model from ~148 MB to ~77 MB and cut Whisper decode+inference from **42.4 s → 19.6 s**, while the synthetic fixture score stayed **100/100**.

Baseline and optimized runs use the **same device and workload**, so the result is a real deployment change — not a theoretical model comparison on a desktop GPU.

---

## Demo video

**[Open demo video (OneDrive)](https://1drv.ms/v/c/a6e600124ed58265/IQBUCYZsUx9NRqeHDfu7wqReAX8g8ULShqJiiKOHG-2q_Kc)** — Edge Lab walkthrough on device.

Please be patient while a live benchmark runs (~**20–55 seconds** on-device depending on model and temperature). Stage bars update during the run.

> **Devpost note:** For the official submission video, host a ≤3 minute public copy on **YouTube / Vimeo / Youku** (challenge rules). Keep this OneDrive link as a supplementary high-resolution copy if useful.

---

## Edge Lab — optimization proof

In the app: **More → Edge Lab** (development / diagnostics build).

| Published win on device | Before → After |
|:---:|:---:|
| ![Results — live optimized run](benchmarks/reports/edge-lab/01-results-live-optimized.jpg) | ![Compare — published evidence](benchmarks/reports/edge-lab/04-compare-published-before-after.jpg) |
| −53.8% speech · live bars · fixture 100/100 | base.en → tiny.en shipped · quality held |

| Honest experiments | Engineering story |
|:---:|:---:|
| ![Experiments — rejected knobs](benchmarks/reports/edge-lab/06-experiments-rejected-honest.jpg) | ![Story — phases](benchmarks/reports/edge-lab/08-story-phases.jpg) |
| Failed knobs stay visible — no cherry-picking | Freeze → measure → reject → accept → ship |

**Why “REJECTED” is good:** config knobs were tried first and failed the ≥5% gate (or made things worse). Only `tiny.en` cleared latency **and** fixture quality, then shipped into production Voice-to-Care.  
Guide: [`docs/arm/MEDIA_PACK.md`](docs/arm/MEDIA_PACK.md)

---

## How we optimized

```text
Freeze baseline → Measure S20 Ultra → Find bottleneck (Whisper ~83%)
→ One-variable experiments → Quality gate → Ship tiny.en
```

| Experiment | Change | Verdict |
|---|---|---|
| EXP-01 | Whisper threads 4→6 | **REJECTED** (~72% slower) |
| EXP-02 | Empty prompt | **REJECTED** (<5% gate) |
| EXP-03 | `speedUp: true` | **REJECTED** (<5% gate) |
| EXP-06 | `ggml-tiny.en.bin` | **ACCEPTED + SHIPPED** (−53.8% Whisper) |

More threads was **not** assumed better on this Arm phone — EXP-01 proved oversubscription can hurt. Details: [`docs/arm/EXPERIMENT_LOG.md`](docs/arm/EXPERIMENT_LOG.md) · [`docs/arm/PROMOTION_EXP06.md`](docs/arm/PROMOTION_EXP06.md) · [`docs/arm/QUALITY_GATE.md`](docs/arm/QUALITY_GATE.md)

### Qwen — retained on purpose

| Model | Status | Reason |
|---|---|---|
| **Qwen 2.5 0.5B Instruct Q4_K_M** | **Retained (baseline)** | Not the dominant bottleneck (~3.5% of measured stage time) |
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
