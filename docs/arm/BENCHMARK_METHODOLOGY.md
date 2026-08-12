# Benchmark methodology

**Status:** Skeleton (Phase 1)  
**Rule:** Simple structured JSON first. Expand only if a measurement gap blocks a decision.

## Philosophy

The benchmark engine is a **means** to optimization evidence — not the product.

Priority:

1. Get real baseline numbers from the S20 Ultra  
2. Attack the biggest measured bottleneck  
3. Measure again (performance **and** quality)  
4. Then enrich Edge Lab UI around the evidence  

Do not spend days building an elaborate framework before the first device measurement.

## Pipeline stages to time (Phase 2+)

```text
M4A decode          ← not separable in JS today (null)
      ↓
Whisper load        ← initWhisper (lab-owned cold context)
      ↓
Whisper inference   ← context.transcribe wall clock = decode + infer
      ↓
Qwen load           ← offline-AI loadModel
      ↓
Qwen inference      ← offline-AI generate
      ↓
Total (lab path; no clinical SQLite apply)
```

**Phase 2 implementation:** `apps/mobile/src/features/edge-lab/services/runEdgeLabHarness.ts`  
Logcat tag: `EDGE_LAB_EVIDENCE`  
Fixture: `benchmarks/fixtures/README.md` → on-device `edge-lab-fixture-v1.m4a`

Optional later: fixture persist step for harness completeness — **never** the production worker-confirm clinical write path.

## Metric categories

| Category | Measurement |
|---|---|
| Latency | decode, Whisper load/infer, Qwen load/infer, total |
| AI speed | tokens/sec (where runtime provides) |
| Speech | real-time factor (audio duration / infer time) when duration known |
| Memory | model footprint; peak process memory if available |
| Storage | model file sizes (from manifests / disk) |
| CPU | average / peak utilization if available |
| Thermal | start / end temperature if available |
| Battery | level before / after — **observational only** |
| Quality | transcription accuracy proxy; structured extraction accuracy |
| Reliability | successful vs failed runs |
| Runtime | backend, package versions |
| Device | Arm evidence fields (see ARM_OPTIMIZATION.md) |
| Configuration | threads, model ids, hashes |

### Battery honesty

Do **not** claim:

> Battery dropped from 90% to 87%, therefore the model consumed 3%.

Do report:

> Battery level change observed during standardized workload

paired with elapsed time, temperature, CPU (if available), and workload count.

## Workload rules

- Synthetic fixture audio only — never real patient recordings  
- Prefer airplane mode + cooled device + similar charge state for comparable runs  
- Repeat runs (N ≥ 3 when time allows); report individual + summary  
- Store raw JSON under `benchmarks/raw/`  
- Promote summaries to `benchmarks/baseline/` or `benchmarks/optimized/` only after review  

## Quality gate

An optimization is accepted only if:

- Performance improves on the targeted metric(s), **and**
- Quality remains within the agreed acceptance threshold (defined when the quality harness lands in Phase 3–6)

Rejected experiments remain in the timeline — they are evidence too.

## Privacy

Logs and exports must not contain transcripts, audio payloads, tokens, PINs, full QR payloads, or health identifiers. Use fixture ids and aggregate metrics only.

## Schema

Phase 1 ships a minimal TypeScript / JSON shape in `apps/mobile/src/features/edge-lab/domain/types.ts`.  
Widen the schema only when a Phase 2+ measurement requires it.
