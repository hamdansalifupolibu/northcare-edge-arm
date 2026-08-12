# Architecture checkpoint — device-pending pack

**Stage:** NorthCare Edge — architecture complete / device deferred  
**Date:** 2026-08-11  
**Status:** COMPLETE for offline review — Phase 3+ numbers wait on S20 Ultra  

## Intent

Ship everything in the plan that does **not** require the phone:

- Edge Lab full navigation + screens  
- Experiment catalog  
- Quality gate + bottleneck + compare + export  
- Arm documentation pack + future README skeleton  
- Device runbook for the later plug-in session  

Do **not** invent benchmark results.

## Plan coverage

| Plan item | State |
|---|---|
| Freeze → measure → optimize → prove → visualize → document → submit | Architecture through visualize/document skeletons; measure/optimize wait on device |
| Phase 1 Freeze | Done |
| Phase 2 Instrumentation | Done |
| Phase 3 Baseline on device | **Deferred** — `DEVICE_RUNBOOK.md` |
| Phase 4 Bottleneck | Algorithm + UI ready; needs run |
| Phase 5–8 Experiments | Catalog + gate ready; execution on device |
| Phase 9 Edge Lab UI | Overview / Compare / Experiments / Timeline / Export done |
| Phase 10 Docs + README | Arm pack + README skeleton (root README not replaced yet) |
| Phase 11 Public repo | Deferred (local only) |
| Phase 12 Submit pack | Deferred |

## Files created (this checkpoint)

### App

- `app/(development)/edge-lab/_layout.tsx`
- `app/(development)/edge-lab/index.tsx`
- `app/(development)/edge-lab/compare.tsx`
- `app/(development)/edge-lab/experiments.tsx`
- `app/(development)/edge-lab/timeline.tsx`
- `app/(development)/edge-lab/export.tsx`
- `src/features/edge-lab/components/EdgeLabChrome.tsx`
- `src/features/edge-lab/navigation/edgeLabRoutes.ts`
- `src/features/edge-lab/domain/qualityGate.ts`
- `src/features/edge-lab/domain/bottleneckAnalysis.ts`
- `src/features/edge-lab/domain/compareRuns.ts`
- `src/features/edge-lab/experiments/experimentCatalog.ts`
- `src/features/edge-lab/services/edgeLabBaselineStore.ts`
- `src/features/edge-lab/services/edgeLabExport.ts`
- `src/features/edge-lab/screens/EdgeLabCompareScreen.tsx`
- `src/features/edge-lab/screens/EdgeLabExperimentsScreen.tsx`
- `src/features/edge-lab/screens/EdgeLabTimelineScreen.tsx`
- `src/features/edge-lab/screens/EdgeLabExportScreen.tsx`
- `src/features/edge-lab/__tests__/qualityGate.test.ts`

### Docs / fixtures

- `docs/arm/EDGE_LAB_ARCHITECTURE.md`
- `docs/arm/DEVICE_RUNBOOK.md`
- `docs/arm/EXPERIMENTS_CATALOG.md`
- `docs/arm/QUALITY_GATE.md`
- `docs/arm/NORTHCARE_EDGE_README_SKELETON.md`
- `docs/arm/PHASE_ARCHITECTURE_CHECKPOINT.md`
- `docs/arm/NATIVE_ANDROID_ENGINEERING.md` (expanded)
- `docs/arm/REPRODUCIBILITY.md` (expanded)
- `benchmarks/fixtures/edge-lab-fixture-v1.expected.json`

## Files modified

- Edge Lab Overview screen (chrome + pin baseline)
- `edge-lab/index.ts` exports
- `docs/arm/README.md`, `OPTIMIZATION_TIMELINE.md`, `LOCKED_DECISIONS.md` (status)
- `docs/README.md`, `PROJECT_STATUS.md`
- Removed flat `app/(development)/edge-lab.tsx` in favour of folder routes

## Safety

- Clinical workflows untouched  
- No production AI config promotion  
- No fabricated latency/quality numbers  

## How to continue when the phone arrives

1. Open `docs/arm/DEVICE_RUNBOOK.md`  
2. Run Phase 3 only  
3. Let bottleneck + catalog decide the first experiment  

## Approval

Architecture pack ready for human review. Device session is the next evidence gate.
