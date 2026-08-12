# MVP Delivery Plan

**Product:** NorthCare AI  
**Competition:** UNICEF StartUp Lab — AI for Nurturing Care Hackathon  
**Deadline (documented):** 11 August 2026  
**Target device:** Samsung Galaxy S20 Ultra (Android-first)  
**Stitch project:** `749026157623860355`

## Goal

Deliver the **smallest complete vertical journey** that proves:

1. Offline-first clinical workflow  
2. Responsible AI (human review + deterministic danger signs)  
3. Last-mile referral continuity (QR passport)  
4. Localised nutrition / caregiver guidance  
5. Sync-when-connected behaviour  

Not a chatbot demo. Not a website. Not design-only.

## P0 judge demonstration journey (must work)

| Step | Journey action | Primary stages |
|---|---|---|
| 1 | App launch / animated splash | S4, S17 |
| 2 | Returning worker offline PIN unlock | S6 |
| 3 | Worker dashboard with offline indicator | S4, S7 |
| 4 | Select or register client | S7 |
| 5 | Start new visit | S8 |
| 6 | Voice **or** guided capture | S11 and/or S8 |
| 7 | Review structured information | S11 (voice) / S8 (guided) |
| 8 | Complete at least one screening | S8 |
| 9 | Explainable Red/Amber/Green result | S9 |
| 10 | Create referral + save locally | S10 |
| 11 | Generate QR Referral Passport | S10 |
| 12 | Show waiting-for-connection / sync queue | S5, S10, S14 |
| 13 | Restore connectivity | Manual / emulator toggle |
| 14 | Synchronise referral (real or convincingly mocked) | S14 |
| 15 | Update referral timeline | S10, S14 |
| 16 | Caregiver / nutrition guidance | S12 |
| 17 | Follow-up notification (local acceptable) | S15 |

**Backup path (required):** if voice fails, guided screening alone must still complete steps 7–17.

## Shortest complete implementation path

### Track A — Competition-critical (must finish)

| Order | Stage | MVP slice | Priority |
|---|---|---|---|
| 1 | S0 | Source of truth / open decisions | P0 |
| 2 | S1 | Repo standards, AGENTS, secrets policy | P0 |
| 3 | S2 | Harden existing Expo 57 app; emulator smoke | P0 |
| 4 | S3 | Tokens + core components (RiskCard, SyncIndicator, Button) | P0 |
| 5 | S4 | Nav shell, splash, onboarding, worker tabs | P0 |
| 6 | S5 | SQLite schema + repositories + seed data | P0 |
| 7 | S6 | Worker login + PIN unlock (offline) | P0 |
| 8 | S7 | Client list/register/profile offline | P0 |
| 9 | S8 | Start visit + **one** guided screening form | P0 |
| 10 | S9 | Deterministic risk engine + explainable result | P0 |
| 11 | S10 | Referral create + QR passport + local timeline | P0 |
| 12 | S11 | Voice capture UI + **mock** extraction + review confirm | P0 |
| 13 | S12 | Nutrition planner lite + Dagbanli-ready copy placeholders | P0 |
| 14 | S14 | Sync Centre + queue; mock sync acceptable if backend late | P0* |
| 15 | S15 | Local in-app + scheduled notifications for follow-up/referral | P1→P0 for demo polish |
| 16 | S17 | Polish only demo screens to Stitch fidelity | P0 |
| 17 | S18 | Security/privacy/a11y hardening of demo path | P0 |
| 18 | S19 | Demo script, synthetic data, APK/build, README | P0 |

\*P0 requirement is **prove** saved-locally → syncing → synced. Real FastAPI preferred; high-quality mock sync with clear “demo mode” label is acceptable if backend decision slips.

### Track B — Convincing prototype (after Track A stable)

| Stage | Slice | Priority |
|---|---|---|
| S13 | Ask NorthCare constrained + Lite Answers | P1 |
| S14 | Real FastAPI + conflict handling | P1 |
| S15 | Push notifications | P1 |
| S8 | Additional screening forms (PNC/newborn/child) | P1 |
| S16 | Admin dashboard lite | P1 |

### Track C — Deferred

| Item | Priority |
|---|---|
| On-device Whisper / local LLM | P2–P3 |
| GhanaNLP live integration | P2–P3 |
| Full admin CMS + audit | P2–P3 |
| QR scanning at receiving facility | P2 |
| iOS / tablet optimisation | P3 |
| Field encryption / SQLCipher | P2–P3 |
| Biometrics beyond Expo SecureStore/LocalAuthentication | P2 |

## Explicit MVP exclusions (do not block demo)

- Full administrator workspace  
- Password recovery / first-time password change (unless already trivial)  
- Facility management CMS  
- Real Dagbanli medical audio library (use reviewed placeholders + mark status)  
- Unconstrained generative AI diagnosis  
- Production Firebase/GCP deployment if mock sync is approved  
- Multiple guided screening packs beyond one complete form  

## Demo data requirements

- Synthetic clients only (e.g. Amina Suleiman profile pattern from Stitch)  
- Seeded urgent/red case for referral demo  
- Seeded pending sync queue items  
- Reset-demo script or documented wipe/reseed  

## Success definition for competition MVP

The judge can observe, on Android (emulator or S20 Ultra), without continuous internet:

1. Worker unlocks offline  
2. Opens high-risk client  
3. Completes visit (voice **or** guided)  
4. Sees explainable risk result  
5. Creates referral + QR passport  
6. Sees local save / pending sync  
7. After connectivity, sync status updates  
8. Sees nutrition/caregiver guidance (Dagbanli-ready at least in UI)  

Repository remains reproducible, secret-free, and documented.
