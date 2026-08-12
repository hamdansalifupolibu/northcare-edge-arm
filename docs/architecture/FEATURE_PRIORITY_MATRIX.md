# Feature Priority Matrix

**Legend**
- **P0** — Required for competition demonstration  
- **P1** — Important for a convincing prototype  
- **P2** — Valuable extension after core MVP  
- **P3** — Post-hackathon / pilot  

Status values reflect design/repo readiness as of 2026-08-02, not implementation status (implementation is mostly not started).

| ID | Feature | Priority | Stage | Design readiness | Notes |
|---|---|---|---|---|---|
| F01 | Animated splash | P0 | S4/S17 | Present (final animated) | Prefer `splash_screen_animated` |
| F02 | Onboarding ×3 | P0 | S4 | Present | |
| F03 | Workspace selection | P0 | S4/S6 | Present | Worker path P0; admin path P1 |
| F04 | Worker login | P0 | S6 | Present | |
| F05 | Offline PIN create/unlock | P0 | S6 | Present | Core offline proof |
| F06 | Worker dashboard | P0 | S4/S7 | Present | |
| F07 | Client directory search/filter | P0 | S7 | Present | |
| F08 | Client registration (minimal multi-step) | P0 | S7 | Incomplete (type step only) | Implement ≥ type + basics |
| F09 | Client profile + history | P0 | S7 | Present (Amina) | Use synthetic data |
| F10 | Start new visit chooser | P0 | S8 | Present | |
| F11 | Guided screening (one complete form) | P0 | S8 | Missing forms | Must build; Stitch gap |
| F12 | Voice capture UI | P0 | S11 | Present | |
| F13 | Extraction review + confirm | P0 | S11 | Missing dedicated screen | Build before real AI |
| F14 | Deterministic RAG risk result | P0 | S9 | Present (combined) | Rules source TBD |
| F15 | Referral create | P0 | S10 | Incomplete | Passport exists; create flow incomplete |
| F16 | QR Referral Passport | P0 | S10 | Present | |
| F17 | Local save + sync queue UI | P0 | S5/S14 | Sync Centre present | |
| F18 | Sync when online (mock or real) | P0 | S14 | Partial | Decision: mock vs FastAPI |
| F19 | Nutrition planner lite | P0 | S12 | Present | Content must be marked reviewed/placeholder |
| F20 | Dagbanli-ready guidance UI | P0 | S12/S13 | Partial | Do not fabricate medical translations |
| F21 | Local follow-up notification | P0/P1 | S15 | Centre present | Detail/settings missing |
| F22 | Ask NorthCare constrained | P1 | S13 | Present UI | Full retrieval P1 |
| F23 | Offline Lite Answers | P1 | S13 | Not designed fully | |
| F24 | Admin dashboard | P1 | S16 | Present | Not on P0 path |
| F25 | Worker management | P1 | S16 | Present | |
| F26 | Real FastAPI backend | P1 | S14 | Not present | Preferred if time |
| F27 | Conflict resolution | P1 | S14 | System states screen | |
| F28 | Push notifications | P1 | S15 | — | After backend |
| F29 | Additional screening packs | P1 | S8 | Missing | ANC/PNC/newborn/child |
| F30 | Privacy consent flow | P1 | S6 | Present | Can simplify for demo |
| F31 | Biometric unlock | P2 | S6 | Option on login | Device-dependent |
| F32 | Password recovery | P2 | S6 | Missing | |
| F33 | Facility confirmation wizard | P2 | S6 | Missing | |
| F34 | QR scan at receiving facility | P2 | S10 | Missing | |
| F35 | GhanaNLP integration | P2 | S12/S13 | Assumption | Verify availability |
| F36 | On-device STT / local LLM | P2–P3 | S11/S13 | High risk | Post-MVP likely |
| F37 | Facility management | P2 | S16 | Missing | |
| F38 | Content CMS | P2 | S16 | Missing | |
| F39 | Audit history UI | P2 | S16 | Missing | |
| F40 | SQLCipher / field encryption | P2–P3 | S5/S18 | — | |
| F41 | iOS support | P3 | — | — | Android-first |
| F42 | Tablet layouts | P3 | S17 | — | |

## Stage priority summary

| Stage | Priority for competition |
|---|---|
| S0–S10 | P0 |
| S11–S12 | P0 (with mocks/placeholders allowed) |
| S13 | P1 |
| S14 | P0 for sync proof; P1 for production backend |
| S15 | P0 local alerts; P1 push |
| S16 | P1 |
| S17–S19 | P0 focused on demo path |
