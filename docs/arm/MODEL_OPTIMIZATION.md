# Model optimization rules

**Status:** Skeleton (Phase 1)  
**Promotion policy:** Lab-only until explicit human approval ([LOCKED_DECISIONS.md](LOCKED_DECISIONS.md) §2)

## Core rule

**Baseline first. Optimization second.**

Do not assume the best next step is a smaller model, more threads, or a different quantisation. Choose the next experiment from the **largest measured bottleneck** in the instrumented pipeline.

Example (illustrative only — not real results):

| If the baseline shows… | Then investigate… |
|---|---|
| Whisper inference dominates | Decoding settings / threads / speech workload |
| Model load dominates | Lifecycle, preload, retention strategy |
| Qwen inference dominates | Prompt size, generation limits, threads |

## One-variable discipline

Each experiment changes **one** primary variable (or one tightly coupled pair that cannot be separated). Record:

- Hypothesis (Arm-aware when possible)
- Variable changed
- Baseline config hash
- Experiment config hash
- Performance deltas
- Quality deltas
- Verdict: `accepted` | `rejected` | `inconclusive`

## Candidate areas (not a commitment order)

Speech:

- Thread count  
- Beam / bestOf (baseline already greedy `1`)  
- Prompt length  
- Load / preload strategy  
- Model size **only if** quality holds **and** measurements justify it  

Language model:

- Thread count  
- Prompt size for extraction  
- `n_ctx` / `n_predict`  
- Load / release lifecycle  
- Generation temperature (quality-sensitive)

Native:

- Decode overhead measurement (document; avoid regressing the M4A patch)

## Forbidden without review

- Silently editing production `WHISPER_TRANSCRIPTION_OPTIONS`
- Silently changing production `resolveOfflineAiThreadCount` / GPU layers for clinical paths
- Connecting lab configs to Voice-to-Care confirm → SQLite apply
- Filling README result tables before device evidence exists

## Quality

See quality gate in [LOCKED_DECISIONS.md](LOCKED_DECISIONS.md) and [BENCHMARK_METHODOLOGY.md](BENCHMARK_METHODOLOGY.md).
