# Quality gate

**Status:** Fixture phrase + extraction scoring implemented (2026-08-11)  
**Code:** `apps/mobile/src/features/edge-lab/domain/qualityGate.ts` · `fixtureQuality.ts` · `fixtures/edgeLabFixtureGolden.json`

## Rule (locked)

```text
Faster + acceptable quality     → ACCEPTED
Faster + significant quality ↓  → REJECTED
Missing measurements            → PENDING / INCONCLUSIVE
```

Never accept on latency alone.

## How quality is scored now

| Layer | Method | Weight |
|---|---|---|
| Transcription | Must-contain phrases + token overlap vs synthetic reference | 70% |
| Extraction | Required JSON keys present (`symptomSummary`, `urgencyLevel`) | 30% |

Golden: `edge-lab-fixture-v1` (synthetic child diarrhea / feeding note).  
Evidence logs **counts only** (phrases matched / keys present) — never full transcript text.

### Thresholds

| Knob | Default | Notes |
|---|---|---|
| Min latency improvement | 5% | Targeted stage or total |
| Max quality drop | 5 points | On 0–100 fixture score |

## Measured on S20 Ultra

| Model | Run | Fixture quality | Phrases | Extraction keys |
|---|---|---:|---|---|
| base.en (reference capture) | `edge_mspax7qr_g2cn` | golden source | 4 phrases defined | — |
| tiny.en (promoted) | `edge_mspazssb_br9p` | **100/100** | 4/4 | 2/2 |

## UI

Edge Lab → **Results** shows live fixture quality.  
**Compare** shows published Before→After including fixture scores.
