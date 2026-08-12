# S20 Ultra baseline — 2026-08-11

**Run id:** `edge_msp5nrdb_2sfe`  
**Mode:** auto (adb trigger)  
**Device:** Samsung Galaxy S20 Ultra (`SM-G988B`), Android 13 (API 33), ABI `arm64-v8a`  
**Fixture:** `edge-lab-fixture-v1` (261,181 bytes)  
**Freeze:** `northcare-edge-baseline-2026-08-11` · `cfg_53e659c2`  
**Raw:** `benchmarks/raw/edge_msp5nrdb_2sfe.json`

## Stage timings

| Stage | ms | Share of measured stages* |
|---|---:|---:|
| M4A decode | — (bundled) | — |
| Whisper load | 4,492 | 8.8% |
| Transcribe (decode+infer) | **42,367** | **82.8%** |
| Qwen load | 2,480 | 4.8% |
| Qwen inference | 1,802 | 3.5% |
| **Total (wall)** | **53,962** | — |

\*Shares exclude wall-clock `total` and null decode; measured sum = 51,141 ms.

## Other metrics

| Metric | Value |
|---|---|
| Tokens/sec (Qwen) | ~34.4 |
| Generated tokens | 29 |
| Transcript char count | 85 |
| Quality score | not measured yet |
| Success | true |

## Bottleneck (Phase 4)

**Primary bottleneck: `whisper_inference` (native M4A decode + Whisper infer).**

First optimization experiments should target Whisper transcription workload (threads / prompt / optional model) — not Qwen first.
