# Phase 2 checkpoint — Instrumentation

**Stage:** NorthCare Edge Phase 2 — Instrument existing Voice-to-Care AI stages  
**Status:** COMPLETE — awaiting human review (device baseline deferred until S20 Ultra is connected)  
**Scope approved:** Lab-only harness + evidence logging + Edge Lab Run control. No clinical workflow changes. No optimization experiments. No invented results.

## Phase 1 review (precondition)

Phase 1 freeze was inspected and accepted as sufficient to proceed:
- Code-sourced baseline (beam=1, threads=4, Qwen Q4_K_M)
- Lab-only promotion policy
- Empty metrics / no fabricated numbers
- Clinical paths untouched

## What was implemented

- Privacy-safe `[EDGE_LAB_EVIDENCE]` logcat logger with key sanitization
- Arm device capture from `Platform` (ABI/SoC/cores remain null until richer APIs)
- Synthetic fixture resolver (`edge-lab-fixture-v1.m4a` under app documents)
- Lab Whisper probe (fresh `initWhisper` load + `transcribe` total; **decode bundled**)
- Lab Qwen probe via offline-AI lifecycle (`release` → `loadModel` → `generate`)
- Orchestrating harness with stage breakdown + AsyncStorage last-run persistence
- Edge Lab Overview **Run benchmark** button + last-run timings UI
- Dev-only `EdgeLabAutomationBridge` (adb trigger file)
- Unit tests for evidence sanitization + config hash stability
- Fixture push / logcat notes under `benchmarks/fixtures/README.md`

## Honest timing limitations

| Stage | Phase 2 behaviour |
|---|---|
| `m4a_decode` | Always `null` (inside whisper.rn native `transcribe`) |
| `whisper_load` | Timed (`initWhisper`) |
| `whisper_inference` | Timed wall clock for `transcribe` = **decode + infer** |
| `qwen_load` | Timed (`loadModel` → `loadMs`) |
| `qwen_inference` | Timed (`generate` → `completionMs`) |
| `total` | Harness wall clock |
| Battery / thermal / peak RAM | `null` (not instrumented yet) |
| Quality score | `null` (Phase 3–6) |

## Files created

- `apps/mobile/src/features/edge-lab/services/edgeLabEvidenceLog.ts`
- `apps/mobile/src/features/edge-lab/services/captureArmDeviceEvidence.ts`
- `apps/mobile/src/features/edge-lab/services/edgeLabFixture.ts`
- `apps/mobile/src/features/edge-lab/services/edgeLabConfigHash.ts`
- `apps/mobile/src/features/edge-lab/services/edgeLabWhisperProbe.ts`
- `apps/mobile/src/features/edge-lab/services/edgeLabQwenProbe.ts`
- `apps/mobile/src/features/edge-lab/services/edgeLabLastRunStore.ts`
- `apps/mobile/src/features/edge-lab/services/runEdgeLabHarness.ts`
- `apps/mobile/src/features/edge-lab/components/EdgeLabAutomationBridge.tsx`
- `apps/mobile/src/features/edge-lab/__tests__/edgeLabEvidenceLog.test.ts`
- `benchmarks/fixtures/README.md`
- `docs/arm/PHASE_2_CHECKPOINT.md`

## Files modified

- `apps/mobile/src/features/edge-lab/domain/types.ts`
- `apps/mobile/src/features/edge-lab/screens/EdgeLabOverviewScreen.tsx`
- `apps/mobile/src/features/edge-lab/index.ts`
- `apps/mobile/app/_layout.tsx` — mount EdgeLabAutomationBridge
- `docs/arm/README.md`
- `docs/arm/OPTIMIZATION_TIMELINE.md`
- `docs/arm/BENCHMARK_METHODOLOGY.md`
- `docs/arm/PHASE_1_CHECKPOINT.md` (status note)
- `PROJECT_STATUS.md`

## Files deleted

- None

## Clinical safety

| Check | Result |
|---|---|
| `createVoiceServices` confirm/apply wrapped? | No |
| Production Whisper/Qwen options changed? | No |
| Transcripts in evidence logs? | No (sanitizer + char counts only) |
| Real patient fixtures required? | No |

## Commands / verification

```text
cd apps/mobile
npm test -- --testPathPattern=edgeLabEvidenceLog
```

S20 Ultra baseline runs are **intentionally deferred** until the device is connected (Phase 3).

## Known limitations

- Fixture must be pushed before a successful end-to-end run
- Decode vs Whisper infer not split without a native patch enhancement
- No More-menu entry yet (locked decision: submission build later)

## Approval gate

Phase 3 (device baseline) waits on S20 Ultra. Optimization experiments (Phase 4+) wait on measured bottlenecks from Phase 3.
