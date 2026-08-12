# Optimization timeline

**Status:** Optimization loop complete on S20 Ultra (lab accept EXP-06)  
**Rule:** Never invent results  
**Full trail:** [`BASELINE_TO_DONE_TRAIL.md`](./BASELINE_TO_DONE_TRAIL.md)

```text
OPTIMIZATION TIMELINE

✓ Baseline configuration frozen (Phase 1 — 2026-08-11)
  Whisper Base.en + Qwen 2.5 0.5B Q4_K_M (code-sourced)

✓ Instrumentation complete (Phase 2 — 2026-08-11)
  Lab harness + EDGE_LAB_EVIDENCE logs
  Note: m4a_decode bundled inside whisper_inference until native split

✓ Baseline established on S20 Ultra (Phase 3 — 2026-08-11)
  Run `edge_msp5nrdb_2sfe` · total 53.96 s
  Raw: benchmarks/raw/edge_msp5nrdb_2sfe.json

✓ Bottleneck identified (Phase 4)
  Primary: whisper_inference (decode+infer) ≈ 82.8% of measured stage time

✓ Experiment 01 — Whisper threads 4→6
  Changed: lab maxThreads=6
  Performance: whisper_inference +71.9% (slower)
  Quality: provisional 96
  Verdict: REJECTED
  Raw: benchmarks/raw/edge_msp5wxf5_ehhj.json

✓ Experiment 02 — Whisper prompt → empty
  Changed: lab prompt=""
  Performance: whisper_inference −0.72% (<5% gate)
  Quality: provisional 96
  Verdict: REJECTED
  Raw: benchmarks/raw/edge_msp61xyw_bzmw.json

✓ Experiment 03 — Whisper speedUp true
  Changed: lab speedUp=true
  Performance: whisper_inference −0.81% (<5% gate)
  Quality: provisional 96
  Verdict: REJECTED
  Raw: benchmarks/raw/edge_msp670iy_7lfm.json

✓ Experiment 06 — Smaller Whisper tiny.en (conditional)
  Changed: lab whisperModelFilename=ggml-tiny.en.bin
  Performance: whisper_inference −53.8%; total −50.9%
  Quality: provisional 96 (chars 85→85)
  Verdict: ACCEPTED + PROMOTED into production Voice-to-Care
  Raw: benchmarks/raw/edge_msp6cf7n_d5qs.json
  Summary: benchmarks/optimized/s20-ultra-accepted-exp06-2026-08-11.md
  Promotion: docs/arm/PROMOTION_EXP06.md

✓ Edge Lab UI polished + phone-ready (Phase 9)
  Preflight · import fixture · progress · history · More entry

✓ Arm docs pack + README skeleton (Phase 10 architecture)
  Trail doc: docs/arm/BASELINE_TO_DONE_TRAIL.md
  README skeleton filled with measured Before→After

✓ Production promotion (2026-08-11)
  whisper-model-manifest.json → ggml-tiny.en.bin

· Stronger quality goldens (beyond length proxy)
· Public NorthCare Edge repository (Phase 11)
· Final benchmark + video + submission (Phase 12)
```

Accepted and rejected experiments both stay on this timeline.
