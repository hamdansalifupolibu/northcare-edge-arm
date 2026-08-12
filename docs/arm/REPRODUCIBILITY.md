# Reproducibility

**Status:** Procedure ready — numeric reproduction waits on S20 Ultra + fixture

## Intent

Another engineer with the same Arm device class, models, and synthetic fixture should reproduce baseline and accepted optimized runs.

## Fixed inputs

| Input | Reference |
|---|---|
| Baseline freeze | [BASELINE_FREEZE.md](BASELINE_FREEZE.md) |
| JSON twin | `apps/mobile/src/features/edge-lab/baseline/baselineConfig.json` |
| Config hash | `computeEdgeBaselineConfigHash()` |
| Fixture id | `edge-lab-fixture-v1` |
| Evidence tag | `EDGE_LAB_EVIDENCE` |
| Whisper options | `whisperTranscriptionOptions.ts` |
| Qwen threads / lifecycle | `threadCount.ts`, `offlineAiLifecycle.ts` |
| Native decode patch | `patches/whisper.rn+0.2.5.patch` |

## Run procedure

Follow [DEVICE_RUNBOOK.md](DEVICE_RUNBOOK.md).

Minimum comparable run conditions:

- Airplane mode for offline claim  
- Cooled device  
- Similar battery band  
- N ≥ 3 repeats when time allows  
- Same fixture bytes  

## Artifacts

| Path | Content |
|---|---|
| `benchmarks/raw/` | Untouched JSON exports |
| `benchmarks/baseline/` | Reviewed baseline summaries |
| `benchmarks/optimized/` | Reviewed accepted configs |
| `benchmarks/reports/` | Human reports |
| Device AsyncStorage | Last run + designated baseline |

## Privacy

Exports must not include transcripts, audio, tokens, PINs, or health identifiers. The export bundle enforces metric-only fields.
