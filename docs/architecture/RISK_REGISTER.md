# Risk Register

**Last updated:** 2026-08-02  
**Status key:** Open | Mitigating | Accepted | Closed

| ID | Category | Risk | Impact | Likelihood | Status | Mitigation |
|---|---|---|---|---|---|---|
| R01 | Schedule | Competition deadline pressure (11 Aug 2026 documented) | High | High | Open | Strict P0 path; freeze P2/P3; checkpoint after each stage |
| R02 | Technical | Expo managed vs dev build for audio/SQLite/biometrics | High | Medium | Open | Decide in S2; start managed; plan prebuild if blocked |
| R03 | Technical | Speech-to-text not reliable offline on S20 Ultra | High | High | Open | Guided fallback is first-class; mock extraction for demo |
| R04 | AI / Safety | Unreviewed AI output becomes clinical record | Critical | Medium | Open | Mandatory review UI before persist (S11 before real AI) |
| R05 | AI / Safety | LLM used for danger-sign decisions | Critical | Medium | Open | Deterministic rule engine only (S9); tests gate merge |
| R06 | Health-safety | Fabricated medical protocols / Dagbanli translations | Critical | Medium | Open | Placeholder labelling; human review; no invented medical text |
| R07 | Language | GhanaNLP unavailable / unstable | Medium | High | Open | Treat as enhancement; ship reviewed static strings |
| R08 | Product | Stitch gaps (guided forms, extraction review, referral create) | High | Confirmed | Mitigating | Build missing screens from IA + design tokens; document gaps |
| R09 | Brand | Primary teal conflict `#005C55` vs approved `#0F766E` | Medium | Confirmed | Open | Decision required before S3 token freeze |
| R10 | Brand | Multiple logo assets / “Origional logo.png” | Medium | Confirmed | Open | Extract official SVG; forbid silent logo invention |
| R11 | Offline | Over-claiming offline admin / cloud AI features | High | Medium | Open | Feature matrix honesty; UI status chips |
| R12 | Data | Sync conflicts corrupt referrals | High | Medium | Open | Version fields + conflict strategy in S5/S14 |
| R13 | Privacy | PII in logs, AsyncStorage, or lock-screen notifications | Critical | Medium | Open | SecureStore policy; log scrubber; privacy copy tests |
| R14 | Security | Secrets committed (Stitch key already in local `.env`) | Critical | Medium | Mitigating | `.gitignore` includes `.env`; never commit; rotate if exposed |
| R15 | Demo | Voice mic fails during live demo | High | Medium | Open | Backup guided path rehearsed (S19) |
| R16 | Demo | Emulator ≠ S20 Ultra behaviour | Medium | Medium | Open | Device checklist in S19; early device smoke after S6 |
| R17 | Architecture | Navigation choice (Expo Router vs React Navigation) churn | Medium | Medium | Open | Decide before S4; document in decisions log |
| R18 | Architecture | Backend scope undecided (mock vs FastAPI) | High | Medium | Open | Decide before S14; mock sync allowed for P0 if approved |
| R19 | Design | HTML Stitch exports mistaken for web app direction | High | Low | Mitigating | Explicit anti-web rule in AGENTS / Cursor rules |
| R20 | Team/Process | Stages auto-continue without review | Medium | Medium | Open | Checkpoint stop rule mandatory |
| R21 | Content | Danger-sign rule source not approved (WHO/GHS?) | Critical | High | Open | Block “final clinical rules” until source approved; use clearly labelled demo ruleset if needed |
| R22 | Legal/Competition | Real patient data in repo/screenshots | Critical | Low | Open | Synthetic-only policy; screenshot review |
| R23 | Performance | Heavy animation/images on mid-range Android | Medium | Medium | Open | Tonal elevation; reduced motion; asset budget in S17/S18 |
| R24 | Dependency | Package incompatibility with Expo SDK 57 | High | Medium | Open | Verify every package against Expo 57 docs before install |

## Top risks to resolve before coding (S1+)

1. **R21** — Danger-sign rule authority / demo ruleset labelling  
2. **R09** — Primary colour token freeze  
3. **R17** — Navigation library  
4. **R02** — Expo Go vs development build  
5. **R18** — Sync: mock vs real backend for submission  
6. **R10** — Official logo asset selection  

See `TECHNICAL_DECISIONS_REQUIRED.md`.
