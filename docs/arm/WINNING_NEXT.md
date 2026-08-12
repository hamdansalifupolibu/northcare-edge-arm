# Winning next (post-UI polish)

## Already strong

- Measured −53.8% Whisper / −50.9% E2E / −48% model size on Arm64 S20 Ultra  
- Rejected experiments documented (honesty)  
- Quality-gated promotion into production  
- Edge Lab judge UI with published Before→After on first screen  
- Full trail under `docs/arm/BASELINE_TO_DONE_TRAIL.md`

## Highest-leverage remaining (do in order)

1. **Screenshot pack** — capture Results / Compare / Experiments / Story (`SCREENSHOT_CHECKLIST.md`) into `benchmarks/reports/`  
2. **≤3 min demo video** — show Edge Lab Results → Compare → More entry; say freeze→reject→promote once  
3. **Licence + public repo** — required for Devpost (`LICENSING_DECISION.md` first)  
4. ~~**WER / phrase goldens**~~ **Done** — fixture phrases + extraction keys (`fixture_combined_v1`); tiny.en scored **100/100** on `edge_mspazssb_br9p`  
5. **Optional second Arm win** — expose native M4A decode ms separately, or warm-vs-cold load note (nice-to-have, not blocker)

## Do not chase

- Random Qwen thread sweeps (bottleneck was Whisper)  
- Invented metrics or multi-device numbers you do not have  
- Clinical UI rewrites
