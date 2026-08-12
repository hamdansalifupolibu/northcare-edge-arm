# Stage 9 Stitch Alignment

Stitch is a visual reference only — not production React Native code.

| Screen | Route | Stitch reference | Components | Notes |
|---|---|---|---|---|
| Priority evaluation / result | `.../visits/[visitId]/risk` | screening_result | RiskSummaryCard, RiskIcon, explanation, factors, acknowledgement | Unified screen for RED/AMBER/GREEN/UNDETERMINED |
| Contributing factors | `.../risk/factors` | factors detail | RiskFactorList, RiskBadge | No raw condition JSON |
| Priority history | `.../risk/history` | result history | RiskBadge, Current/Superseded labels | Superseded clearly marked |
| Unavailable | same risk route (state) | — | RulePackUnavailableState | Fail closed |
| Dev preview | `(development)/risk-engine-preview` | — | scenario buttons | Production gated |

## Accessibility

Priority communicated by icon + text label (not colour alone). Undetermined uses distinct icon + wording. Touch targets follow Stage 3 standards.

## Known differences

Android visual validation pending (`emulator-5554` offline). Do not claim pixel-perfect Stitch alignment.
