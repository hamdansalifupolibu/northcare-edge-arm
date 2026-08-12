# MVP Scope

## Competition-Critical MVP (Must-Have for 11 August 2026)

The competition-critical MVP must demonstrate the smallest complete product journey that proves the value of NorthCare AI. It must strongly demonstrate offline-first operation, practical clinical utility and responsible AI.

### MVP Feature Set

| Feature | Scope | Justification |
|---|---|---|
| **Splash screen** | Animated splash with offline status messages | First impression; shows offline awareness |
| **Onboarding** | 3-slide value proposition | Communicates product mission to judges |
| **Workspace selection** | Worker vs Admin role selection | Demonstrates role-based access |
| **Worker login** | Credential-based login with PIN creation | Establishes identity and security model |
| **PIN unlock** | Offline PIN authentication for returning users | Proves offline access works |
| **Worker dashboard** | Greeting, priority alerts, quick actions, stats, offline indicator | Central hub demonstrating awareness |
| **Client directory** | Searchable list with risk-colour filtering | Shows client management at scale |
| **Client registration** | Multi-step guided registration (at least type selection + basic info) | Core workflow entry point |
| **Client profile** | View client details, visit history, risk status | Demonstrates longitudinal care record |
| **Start new visit** | "Speak a Case" vs "Guided Questions" choice | Shows dual input modality |
| **Voice capture** | Audio recording with waveform and live transcript | Signature AI feature |
| **Extraction review** | Review AI-extracted fields before confirmation | Demonstrates responsible AI / human review |
| **Guided screening** | At least one complete screening form (e.g. ANC or child health) | Shows structured assessment capability |
| **Risk result** | Red/Amber/Green explainable outcome with danger signs | Core decision-support output |
| **Referral creation** | Create referral with facility, urgency, reason | Critical care-continuity feature |
| **QR Referral Passport** | Offline QR code generation with referral details | Unique offline-first innovation |
| **Nutrition planner** | Food diversity ring, local food chips, basic guidance | Addresses nutrition challenge area |
| **Dagbanli readiness** | At least key caregiver guidance available in Dagbanli | Demonstrates localisation commitment |
| **Sync centre** | Visual sync status, saved locally indicator, sync-now button | Proves offline-first architecture |
| **Offline operation** | All above features functional without internet | Core competition requirement |
| **Local SQLite storage** | All client, visit, screening, referral data stored locally | Technical foundation for offline-first |

### MVP Navigation Structure

```
Bottom Navigation (5 tabs):
  Home → Worker Dashboard
  Clients → Client Directory → Profile → Visit
  Assistant → Ask NorthCare (basic)
  Referrals → Referral list → Passport
  More → Sync Centre, Settings stub
```

---

## Secondary Features (Important but Not Required for First Demo)

| Feature | Why Secondary | When |
|---|---|---|
| Ask NorthCare AI assistant (full) | Requires constrained LLM integration | Stage 13 |
| Notification centre | Important but not in the critical path | Stage 15 |
| Admin dashboard (full) | Secondary user role | Stage 16 |
| Worker management | Admin feature | Stage 16 |
| Privacy consent flow | Can be simplified for demo | Stage 6 |
| Preparing workspace (download progress) | Can be simulated for demo | Stage 4 |
| Biometric authentication | Requires physical device | Post-MVP |
| Dagbanli audio playback | Requires recorded audio files | Stage 12 |
| Sync conflict resolution | Requires backend | Stage 14 |
| Backend synchronisation (actual) | Requires deployed FastAPI | Stage 14 |
| Push notifications | Requires backend and device | Stage 15 |
| Multiple screening forms | ANC, PNC, Newborn, Nutrition (start with one) | Stage 8 |

---

## Post-Hackathon Extensions

| Feature | Description |
|---|---|
| Local AI model | On-device quantised model for offline transcription and guidance |
| Full Dagbanli audio library | Professionally recorded and reviewed audio messages |
| GhanaNLP integration | Enhanced Dagbanli text processing |
| Camera + QR scanning | Scan QR referral passports at receiving facilities |
| Growth tracking charts | Longitudinal child growth monitoring |
| Multi-facility sync | Cross-facility referral coordination |
| Content management system | Admin tool for managing approved guidance content |
| Field-level encryption | Enhanced local data protection |
| Automated testing suite | Comprehensive unit, integration and E2E tests |
| iOS support | Cross-platform deployment |
| Tablet optimisation | Larger layout for facility-based use |
| Performance optimisation | Battery life, storage pressure, large dataset handling |

---

## Features Excluded from First Prototype

| Feature | Reason |
|---|---|
| Real backend deployment | Time constraint; demonstrate offline-first capability instead |
| Production Firebase setup | Not needed for demo; mock auth acceptable |
| Real Dagbanli audio recordings | Requires professional recording and review |
| On-device AI model | Requires significant R&D; cloud fallback acceptable |
| iOS testing | Android-first competition target |
| Tablet-specific layouts | Mobile-first for Samsung Galaxy S20 Ultra |
| Real patient data | Synthetic data only |
| HIPAA/GDPR compliance audit | Post-hackathon requirement |
| Load testing | Not relevant for demo |

---

## Main Judge-Demonstration Journey

This is the recommended 5-minute demonstration flow:

```
1. Launch app → Animated splash with offline status messages
   "NorthCare AI works offline from the first second."

2. Onboarding slides (skip after 1-2)
   "Designed specifically for Northern Ghana's health workers."

3. PIN Unlock (returning worker)
   "Amina starts her day without internet."

4. Worker Dashboard
   "She sees 2 urgent cases, 8 records waiting to sync, and her daily overview."

5. Client Directory → Select high-risk client (Amina Suleiman)
   "She can search and filter clients by risk level."

6. Client Profile → View BP trend, encounter history
   "Complete longitudinal record stored locally on her device."

7. Start New Visit → "Speak a Case"
   "She describes symptoms naturally in her own words."

8. Voice Capture → Live waveform + transcript
   "NorthCare AI processes the audio locally for privacy."

9. Extraction Review → AI-structured fields
   "She reviews and confirms every piece of extracted information."

10. Screening Result → RED: Urgent Assessment Required
    "Deterministic rules identify danger signs. The AI explains WHY."

11. Create Referral → Tamale Teaching Hospital, HIGH priority
    "She creates an urgent referral in seconds."

12. QR Referral Passport → Offline QR code
    "The caregiver carries this passport to the hospital — no internet needed."

13. Nutrition Planner → Food diversity ring + local foods
    "Local, affordable foods for Northern Ghana. Available in Dagbanli."

14. Sync Centre → "8 records saved locally, ready to sync"
    "Everything is safe. When she reaches connectivity, it syncs automatically."

15. Summary
    "Offline-first. Voice-powered. Explainable. Responsible. Local."
```

## Backup Demonstration Flow

If voice capture encounters issues during the demo:

```
1-6. Same as above
7. Start New Visit → "Use Guided Questions"
8. Guided Screening → Step-by-step form
9-15. Same as above (screening result through sync centre)
```

This backup flow demonstrates the same clinical value without depending on microphone or AI transcription.
