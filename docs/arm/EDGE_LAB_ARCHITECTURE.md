# Edge Lab architecture

**Status:** Architecture complete (device measurements pending)  
**Code root:** `apps/mobile/src/features/edge-lab/`

## Purpose

Edge Lab is the Arm optimization layer UI and harness embedded in the existing NorthCare AI mobile app. It does **not** replace clinical Voice-to-Care. It measures and (later) compares AI pipeline configurations under a quality gate.

## Layering

```text
┌─────────────────────────────────────────────┐
│ Edge Lab UI (development routes)            │
│ Overview · Compare · Experiments · Timeline │
│ Export                                      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ Harness / domain                            │
│ runEdgeLabHarness · qualityGate             │
│ bottleneckAnalysis · compareRuns            │
│ experimentCatalog · export bundle           │
└──────────────────┬──────────────────────────┘
                   │ lab probes only
        ┌──────────┴──────────┐
        ▼                     ▼
 Whisper probe           Qwen probe
 (initWhisper +          (offline-AI
  transcribe)             load/generate)
        │                     │
        └──────────┬──────────┘
                   ▼
         Evidence log + AsyncStorage
         (no clinical SQLite apply)
```

## Routes (Phase architecture)

| Route | Screen |
|---|---|
| `/(development)/edge-lab` | Overview + run + pin baseline |
| `/(development)/edge-lab/compare` | Baseline vs last + quality gate |
| `/(development)/edge-lab/experiments` | Planned experiment catalog |
| `/(development)/edge-lab/timeline` | Phase / experiment story |
| `/(development)/edge-lab/export` | JSON / CSV share |

Final Arm submission build may also expose a discreet More/Settings entry (see `LOCKED_DECISIONS.md`). Not wired yet.

## What is intentionally outside Edge Lab

- Client / visit / screening / referral / nutrition / USSD clinical flows  
- Voice-to-Care worker confirm → SQLite apply  
- Silent mutation of production Whisper / Qwen options  

## Device-pending boundary

Architecture + empty result slots ship now. Filling numeric cells requires the S20 Ultra session described in `DEVICE_RUNBOOK.md`.
