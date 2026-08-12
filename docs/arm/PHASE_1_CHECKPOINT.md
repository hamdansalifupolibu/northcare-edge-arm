# Phase 1 checkpoint — NorthCare Edge foundation

**Stage:** NorthCare Edge Phase 1 — Freeze foundation  
**Status:** COMPLETE — reviewed; Phase 2 started 2026-08-11  
**Scope approved:** Freeze baseline + docs/arm + Edge Lab Overview shell + empty benchmarks dirs. No instrumentation. No model optimization. No clinical workflow changes.

## What was implemented

- Locked decisions and development sequence under `docs/arm/`
- Code-sourced baseline freeze (Whisper beam=1 / threads=4; Qwen Q4_K_M / threads=4 / GPU layers=0)
- Machine-readable baseline JSON + TypeScript mirror in `edge-lab`
- Minimal metric / Arm evidence TypeScript types (no runner yet)
- Lab-only promotion policy stub (`isEdgeLabConfigPromotedToProduction()` → false)
- Development-only Edge Lab Overview screen at `/(development)/edge-lab`
- Empty `benchmarks/` tree for future raw / baseline / optimized / reports artifacts
- Documentation skeletons for methodology, Arm story, native audio, reproducibility, timeline

## Files created

### docs/arm/

- `README.md`
- `LOCKED_DECISIONS.md`
- `BASELINE_FREEZE.md`
- `ARM_OPTIMIZATION.md`
- `BENCHMARK_METHODOLOGY.md`
- `MODEL_OPTIMIZATION.md`
- `NATIVE_ANDROID_ENGINEERING.md`
- `REPRODUCIBILITY.md`
- `OPTIMIZATION_TIMELINE.md`
- `PHASE_1_CHECKPOINT.md`

### benchmarks/

- `README.md`
- `baseline/.gitkeep`
- `optimized/.gitkeep`
- `raw/.gitkeep`
- `reports/.gitkeep`

### apps/mobile/

- `app/(development)/edge-lab.tsx`
- `src/features/edge-lab/index.ts`
- `src/features/edge-lab/baseline/baselineConfig.json`
- `src/features/edge-lab/baseline/baselineConfig.ts`
- `src/features/edge-lab/domain/types.ts`
- `src/features/edge-lab/domain/experimentPromotion.ts`
- `src/features/edge-lab/screens/EdgeLabOverviewScreen.tsx`

## Files modified

- `docs/README.md` — Arm docs index entry
- `PROJECT_STATUS.md` — Edge Phase 1 note

## Files deleted

- None

## Commands run

```text
(none required for Phase 1 freeze)
```

## Packages installed

- None

## Results

| Check | Result |
|---|---|
| Type-check | Ran `npm run typecheck` in `apps/mobile` — fails on **pre-existing** project errors; **zero** errors under `src/features/edge-lab/` |
| Lint | Not run |
| Tests | Not added |
| Android emulator | Not required for Phase 1 |
| Clinical flows touched | No |
| Production AI config changed | No |
| Invented benchmark numbers | No |

## Offline behaviour

Unchanged. Edge Lab is a development shell only.

## Security and privacy review

- Secrets committed? No  
- Real patient data? No  
- Metrics schema forbids transcript/audio/health payloads  

## Known limitations

- Edge Lab has Overview only — no Benchmark / Compare / Export yet  
- Arm ABI / SoC / core counts intentionally null until on-device capture  
- Licence for public Arm repo still deferred (`docs/development/LICENSING_DECISION.md`)  
- No More-menu entry yet (by design until submission build)

## Outstanding tasks (Phase 2+, not started)

- Instrument decode → Whisper → Qwen → total  
- Run S20 Ultra baseline  
- One-variable experiments under quality gate  
- Discreet judge-facing Edge Lab entry for final Arm build  
- README rewrite + public repo (late)

## Unexpected changes

- None intended. Note: older README text mentioning Whisper `beamSize: 3` is stale; freeze uses code value `1`.

## Approval gate

Do **not** start Phase 2 instrumentation until this checkpoint is approved.
