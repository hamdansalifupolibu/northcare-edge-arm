# Assumptions and Open Questions

## Confirmed Decisions

| Decision | Status |
|---|---|
| Product name: NorthCare AI | Confirmed |
| Tagline: Smarter care. Stronger communities. | Confirmed |
| Platform: React Native + Expo + TypeScript | Confirmed |
| Target OS: Android-first | Confirmed |
| Target device: Samsung Galaxy S20 Ultra | Confirmed |
| Local database: Expo SQLite | Confirmed |
| Secure storage: Expo SecureStore | Confirmed |
| Typography: Plus Jakarta Sans | Confirmed |
| Primary colour: #0F766E (Teal) | Confirmed |
| Accent colour: #F59E0B (Amber) | Confirmed |
| Design system: Material 3 adapted | Confirmed |
| Offline-first architecture | Confirmed |
| No diagnosis or prescription | Confirmed |
| Human review of all AI output | Confirmed |
| Deterministic danger-sign rules | Confirmed |
| English and Dagbanli language support | Confirmed |
| Competition: UNICEF AI for Nurturing Care Hackathon | Confirmed |
| Deadline: 11 August 2026 | Confirmed |

## Current Assumptions

| Assumption | Risk Level | Notes |
|---|---|---|
| Expo Managed workflow will suffice for MVP | Medium | Voice recording and local AI may require a Development Build |
| expo-av supports the required audio recording quality | Low | Well-documented Expo module |
| Expo SQLite is sufficient for the local data volume | Low | Designed for mobile SQLite workloads |
| Plus Jakarta Sans can be bundled with the Expo build | Low | Standard Google Font |
| FastAPI will be used for the backend | Medium | Not yet implemented — may be simplified for hackathon |
| Firebase Authentication is the auth provider | Medium | Needs confirmation during architecture stage |
| GhanaNLP APIs are available for Dagbanli text processing | High | Availability and API stability need verification |
| A sub-billion-parameter local model is feasible on-device | High | May be deferred to post-hackathon |
| Whisper tflite can run on Samsung Galaxy S20 Ultra | High | Requires testing — may use cloud fallback |
| The 5-tab bottom navigation structure matches the IA | Low | Confirmed in Stitch designs: Home, Clients, Assistant, Referrals, More |

## Technical Questions

1. **Expo managed vs development build:** Will expo-av and SQLite work in managed workflow, or do we need a development build from the start?
2. **Local AI model:** Is a local quantised model (e.g. Phi-3-mini, TinyLlama) feasible within the hackathon timeline, or should we defer to cloud-only AI with offline Lite Answers?
3. **Speech-to-text strategy:** Should we attempt local Whisper tflite, or use cloud transcription with an offline guided-question fallback?
4. **Backend scope for MVP:** Should the hackathon MVP include a deployed FastAPI backend, or should it demonstrate pure offline-first with mock sync?
5. **QR code generation:** Which React Native QR library is best suited for offline generation on Android?
6. **Navigation library:** React Navigation v6 or v7? Expo Router?
7. **State management:** React Context, Zustand or Redux Toolkit?
8. **Testing framework:** Jest + React Native Testing Library? Detox for E2E?

## Health-Content Questions

1. **Danger-sign rules:** Where do the approved danger-sign definitions come from? WHO IMNCI? Ghana Health Service protocols?
2. **Nutrition guidance:** Are the local food recommendations professionally reviewed? By whom?
3. **Dagbanli content:** Who reviews and approves the Dagbanli health translations and audio messages?
4. **Clinical assessment forms:** Should the guided screening forms follow specific Ghana Health Service templates?
5. **Risk thresholds:** Are the Red/Amber/Green thresholds based on published clinical guidelines?

## Language Questions

1. **Dagbanli text rendering:** Does Plus Jakarta Sans adequately render Dagbanli characters?
2. **Dagbanli audio:** Are professional Dagbanli audio recordings available, or do they need to be created?
3. **GhanaNLP integration:** What is the current status and API availability of GhanaNLP for Dagbanli?
4. **Translation review:** Who is the authorised reviewer for Dagbanli medical content?

## Data Questions

1. **Synthetic data:** Should we create a synthetic dataset of sample clients, visits and referrals for demonstration?
2. **Facility registry:** Is there a list of real CHPS compounds and health facilities in Northern Ghana we can reference (without exposing real patient data)?
3. **Data retention:** What is the expected local data retention period before records must be synced?
4. **Conflict resolution:** When local and server records conflict, what is the default resolution strategy?

## Competition Questions

1. **Demo format:** Will the demonstration be live on a physical device, a video recording, or a presentation?
2. **Judge technical depth:** Will judges inspect the GitHub repository code, or focus on the demo?
3. **Team size:** How many team members are contributing to the implementation?
4. **Bootcamp timing:** Is the 3-day bootcamp before or after the submission deadline?
5. **Incubation criteria:** What specific criteria determine selection for the incubation pathway?

## Decisions Required Before Implementation

| Decision | Impact | Urgency |
|---|---|---|
| Expo managed vs development build | Architecture foundation | Stage 2 |
| Local AI model scope for MVP | Feature scope and timeline | Stage 11-13 |
| Backend deployment approach for hackathon | Infrastructure and sync scope | Stage 14 |
| Danger-sign rule source and approval | Clinical accuracy and safety | Stage 9 |
| Dagbanli content creation and review process | Language feature completeness | Stage 12-13 |
| State management library selection | Code architecture | Stage 2 |
| Navigation library selection | Routing foundation | Stage 2 |
