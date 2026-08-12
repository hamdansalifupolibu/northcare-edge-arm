# NorthCare Edge — Arm documentation

**Product framing:** Arm-optimized offline voice intelligence for frontline healthcare  
**Parent foundation:** NorthCare AI (existing offline-first clinical app)  
**Competition track:** Arm AI Optimization Challenge 2026  
**Local work first:** public competition repository is created only after the local pack is complete  

**Current state:** Optimization **complete + promoted** (`ggml-tiny.en.bin`) — see [BASELINE_TO_DONE_TRAIL.md](BASELINE_TO_DONE_TRAIL.md) · [PROMOTION_EXP06.md](PROMOTION_EXP06.md)

## Start here

1. [BASELINE_TO_DONE_TRAIL.md](BASELINE_TO_DONE_TRAIL.md) — full freeze → measure → reject → accept story  
2. [SCREENSHOT_CHECKLIST.md](SCREENSHOT_CHECKLIST.md) — judge screenshot order  
3. [WINNING_NEXT.md](WINNING_NEXT.md) — submission priority list  
4. [PROMOTION_EXP06.md](PROMOTION_EXP06.md) — production promotion of tiny.en  
5. [LOCKED_DECISIONS.md](LOCKED_DECISIONS.md) — governing rules  
6. [BASELINE_FREEZE.md](BASELINE_FREEZE.md) — historical freeze (starting line)  
7. [EXPERIMENT_LOG.md](EXPERIMENT_LOG.md) — measured runs  
8. [QUALITY_GATE.md](QUALITY_GATE.md) — accept / reject rules  

## Docs index

| Document | Purpose | Status |
|---|---|---|
| [BASELINE_TO_DONE_TRAIL.md](BASELINE_TO_DONE_TRAIL.md) | End-to-end measured narrative | **Complete** |
| [LOCKED_DECISIONS.md](LOCKED_DECISIONS.md) | Locked product / process decisions | Locked |
| [BASELINE_FREEZE.md](BASELINE_FREEZE.md) | Authoritative baseline + lab optimized cells | Frozen + lab accept |
| [EDGE_LAB_ARCHITECTURE.md](EDGE_LAB_ARCHITECTURE.md) | Lab architecture | Complete |
| [ARM_OPTIMIZATION.md](ARM_OPTIMIZATION.md) | Competition narrative + Arm evidence | Measured |
| [PROMOTION_EXP06.md](PROMOTION_EXP06.md) | Production promotion of tiny.en | **Complete** |
| [BENCHMARK_METHODOLOGY.md](BENCHMARK_METHODOLOGY.md) | How we measure | Ready |
| [QUALITY_GATE.md](QUALITY_GATE.md) | Accept / reject rules | Framework ready |
| [MODEL_OPTIMIZATION.md](MODEL_OPTIMIZATION.md) | One-variable discipline | Ready |
| [EXPERIMENTS_CATALOG.md](EXPERIMENTS_CATALOG.md) | Experiments + verdicts | Measured |
| [EXPERIMENT_LOG.md](EXPERIMENT_LOG.md) | Run-by-run log | Measured |
| [OPTIMIZATION_TIMELINE.md](OPTIMIZATION_TIMELINE.md) | Engineering story checklist | Loop complete |
| [NATIVE_ANDROID_ENGINEERING.md](NATIVE_ANDROID_ENGINEERING.md) | M4A → PCM patch story | Write-up complete |
| [REPRODUCIBILITY.md](REPRODUCIBILITY.md) | Reproduce runs | Procedure ready |
| [DEVICE_RUNBOOK.md](DEVICE_RUNBOOK.md) | S20 Ultra session checklist | Ready |
| [NORTHCARE_EDGE_README_SKELETON.md](NORTHCARE_EDGE_README_SKELETON.md) | Future public README | Filled with evidence |
| [PHASE_OPTIMIZATION_CHECKPOINT.md](PHASE_OPTIMIZATION_CHECKPOINT.md) | Optimization loop checkpoint | Complete |
| [PHASE_1_CHECKPOINT.md](PHASE_1_CHECKPOINT.md) | Freeze | Complete |
| [PHASE_2_CHECKPOINT.md](PHASE_2_CHECKPOINT.md) | Instrumentation | Complete |
| [PHASE_ARCHITECTURE_CHECKPOINT.md](PHASE_ARCHITECTURE_CHECKPOINT.md) | Full architecture pack | Complete |
| [PHASE_POLISH_CHECKPOINT.md](PHASE_POLISH_CHECKPOINT.md) | Phone-ready UI/harness polish | Complete |

## Code / data companions

| Path | Role |
|---|---|
| `apps/mobile/src/features/edge-lab/` | Edge Lab feature |
| `/(development)/edge-lab/*` | Overview · Compare · Experiments · Timeline · Export |
| `benchmarks/raw/` | Captured EDGE_LAB_EVIDENCE JSON |
| `benchmarks/baseline/` | Phase 3 summary |
| `benchmarks/optimized/` | Lab-accepted EXP-06 summary |

## Phase status

| Phase | Status |
|---|---|
| 1 Freeze | Complete |
| 2 Instrumentation | Complete |
| 3 S20 Ultra baseline | **Complete** (`edge_msp5nrdb_2sfe`) |
| 4 Bottleneck | **Complete** (whisper_inference ~83%) |
| 5–8 Optimize under quality gate | **Complete** — EXP-06 accepted |
| 9 Edge Lab UI | Complete |
| 10 Docs / trail | Complete |
| Production promotion | **Complete** (`ggml-tiny.en.bin`) |
| 11–12 Public repo / submit | Later (licence first) |
