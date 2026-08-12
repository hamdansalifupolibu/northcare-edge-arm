# NorthCare Edge — Locked decisions

**Locked:** 2026-08-11  
**Scope:** Arm AI Optimization Challenge 2026 track (local work first; public repo later)

These decisions govern all Edge phases. Do not reverse them without an explicit human checkpoint.

## Product identity

NorthCare Edge is **not** a new healthcare application. It is an Arm optimization layer built around the existing NorthCare AI Voice-to-Care pipeline.

Philosophy:

```text
Freeze → measure → optimize → prove → visualize → document → submit
```

## Locked choices

### 1. Edge Lab entry

| Phase | Entry |
|---|---|
| Development (now) | `/(development)/edge-lab` **and** discreet **More → Edge Lab** when `diagnosticsEnabled` and non-production |
| Final Arm submission build | Keep discreet More entry for judges; never promote into clinical primary navigation |

Clinical worker workflows remain untouched. Edge Lab must stay unobtrusive.

### 2. Experiment promotion

Experimental models and configurations are **lab-only** until explicitly approved.

They must never silently replace production Voice-to-Care defaults (`whisperTranscriptionOptions`, offline-AI lifecycle, extraction provider wiring).

### 3. Documentation home

All Arm competition docs live under **`docs/arm/`**.

### 4. Licence for the future public Arm repository

Do **not** pick a licence for convenience in this phase.

Before creating the public competition repository:

1. Verify ownership / contributor situation from the original NorthCare project.
2. Review `docs/development/LICENSING_DECISION.md`.
3. Then choose MIT or Apache-2.0 (or another agreed licence) deliberately.

Model third-party licences (Whisper MIT, Qwen Apache-2.0) remain as documented in manifests.

### 5. Quality gate

No optimization is accepted until **both** performance and quality are measured.

```text
Faster + acceptable quality     → ACCEPTED
Faster + significant quality ↓  → REJECTED (still shown as experiment)
Worse or inconclusive           → REJECTED / inconclusive
```

Never invent percentages. The device produces the evidence.

## Additional non-negotiables

- Do not modify client, visit, screening, referral, nutrition, or USSD clinical workflows for Edge work.
- Do not invent benchmark numbers in docs or UI before device runs.
- Battery percentage is an **observational** metric (level change during workload), not claimed model energy consumption.
- Optimization candidates are chosen from **measured bottlenecks**, not from assumed model swaps.
- Internal feature-complete target: **2026-08-13**. Reserve **2026-08-14** for final testing, cleanup, and submission.
- Public GitHub Arm repository only after local pack is complete.

## Development sequence (locked)

```text
PHASE 1  Freeze foundation                    ✓
PHASE 2  Instrument Voice-to-Care             ✓
PHASE 3  Real baseline on S20 Ultra           ✓ edge_msp5nrdb_2sfe
PHASE 4  Find biggest bottleneck              ✓ whisper_inference ~83%
PHASE 5  Experiment with ONE variable         ✓ EXP-01–03 + EXP-06
PHASE 6  Measure performance + quality        ✓ S20 Ultra EDGE_LAB_EVIDENCE
PHASE 7  Accept / reject                      ✓ gate applied; EXP-06 accepted
PHASE 8  Promote accepted candidate           ✓ tiny.en → production (PROMOTION_EXP06)
PHASE 9  Build Edge Lab around results        ✓
PHASE 10 Arm documentation + README           ✓ trail + measured skeleton
PHASE 11 Create NorthCare Edge repository     · after licence
PHASE 12 Final benchmark + video + submission · last
```
