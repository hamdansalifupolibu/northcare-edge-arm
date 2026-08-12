# Experiments catalog

**Status:** Measured on S20 Ultra for Whisper-bottleneck series  
**Code twin:** `apps/mobile/src/features/edge-lab/experiments/experimentCatalog.ts`  
**Trail:** [`BASELINE_TO_DONE_TRAIL.md`](./BASELINE_TO_DONE_TRAIL.md)

## Selection rule

Pick the next experiment from the **measured** primary bottleneck after Phase 3.  
Do not start with a smaller Whisper model by default — only after smaller knobs fail or prove insufficient.

## Catalog

| ID | Title | Primary variable | Status | Verdict |
|---|---|---|---|---|
| exp-01-whisper-threads | Whisper thread sweep | `maxThreads` 4→6 | measured | **rejected** |
| exp-02-whisper-prompt-length | Whisper prompt length | prompt → `""` | measured | **rejected** |
| exp-03-whisper-speedup | Whisper speedUp flag | `speedUp` true | measured | **rejected** |
| exp-04-qwen-prompt-compaction | Qwen prompt compaction | extraction prompt size | planned | pending |
| exp-05-qwen-threads | Qwen thread sweep | `n_threads` lab override | planned | pending |
| exp-06-smaller-whisper-conditional | Smaller Whisper (conditional) | `ggml-tiny.en.bin` | measured | **accepted + promoted** |
| exp-07-model-lifecycle | Model lifecycle / preload | load/release strategy | planned | pending |

Note: Original catalog listed Qwen compaction as `exp-03`. Device work ran Whisper `speedUp` as EXP-03 because the bottleneck was Whisper; Qwen items remain planned and renumbered in docs/UI.

## Evidence links

| ID | Raw JSON | Write-up |
|---|---|---|
| exp-01 | `benchmarks/raw/edge_msp5wxf5_ehhj.json` | `experiments/EXP_01_WHISPER_THREADS.md` |
| exp-02 | `benchmarks/raw/edge_msp61xyw_bzmw.json` | `experiments/EXP_02_WHISPER_PROMPT.md` |
| exp-03 | `benchmarks/raw/edge_msp670iy_7lfm.json` | `experiments/EXP_03_WHISPER_SPEEDUP.md` |
| exp-06 | `benchmarks/raw/edge_msp6cf7n_d5qs.json` | `experiments/EXP_06_SMALLER_WHISPER.md` |
