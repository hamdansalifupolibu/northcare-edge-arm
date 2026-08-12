# Release and Demo Plan

## Objective

Ship a competition-ready Android demonstration of NorthCare AI that proves offline-first clinical utility, responsible AI, referral continuity, and sync-on-connectivity — with a reproducible GitHub repository.

## Release trains

| Train | Goal | Includes |
|---|---|---|
| **Demo Alpha** | Internal path works offline | S0–S10 core; guided-only visit OK |
| **Demo Beta** | Voice + nutrition + sync story | + S11 mock voice, S12 lite, S14 mock/real sync, S15 local notify |
| **Demo Freeze** | Judge-ready | S17 polish on demo screens, S18 hardening, S19 packaging |
| **Post-hackathon** | Pilot path | Real backend hardening, GhanaNLP, local models, admin CMS |

## Demonstration script (primary — ~5 minutes)

1. Launch → animated splash (“works offline”)  
2. Skip/shorten onboarding if returning  
3. PIN unlock offline  
4. Dashboard: urgent cases + pending sync count  
5. Open high-risk synthetic client  
6. Start visit → Speak a Case **or** Guided Questions  
7. Review structured fields → confirm  
8. Screening result RED + explanation  
9. Create referral → Tamale Teaching Hospital (or synthetic facility)  
10. Show QR Referral Passport  
11. Nutrition guidance + Dagbanli-ready UI  
12. Sync Centre: saved locally → sync when online  
13. Close: offline-first, explainable, responsible, local  

## Backup script (no microphone)

Replace steps 6–7 with guided screening only. Same result → referral → QR → sync.

## Demo environment checklist

- [ ] Synthetic seed data installed  
- [ ] Demo reset command documented  
- [ ] Airplane-mode rehearsal completed  
- [ ] Online sync rehearsal completed  
- [ ] Voice permission path rehearsed  
- [ ] Backup guided path rehearsed  
- [ ] Lock screen shows no clinical detail  
- [ ] No real patient data / secrets in build  
- [ ] APK or Expo launch path documented  
- [ ] README setup for judges/developers  

## Build & repository readiness

| Item | Owner stage |
|---|---|
| Runnable Android build | S2 → S19 |
| Root README with setup | S1 + S19 |
| Architecture docs | existing + updates each stage |
| Secret scan | S18/S19 |
| Licence | S19 |
| Screenshots (synthetic only) | S19 |
| GitHub organisation / clarity | S1/S19 |
| Tag `demo-freeze-YYYYMMDD` | S19 |

## Git tagging strategy

- `stage-N-complete` optional checkpoint tags  
- `demo-alpha`, `demo-beta`, `demo-freeze` for release trains  
- Never tag builds that contain `.env` secrets  

## Physical device

- Primary target: Samsung Galaxy S20 Ultra  
- Minimum: validate PIN, voice permission, offline save, QR render on device before freeze  

## Submission package

1. Public GitHub repo (no secrets)  
2. Short demo video optional (if allowed)  
3. Live demo device or emulator  
4. One-page architecture + safety statement  
5. Known limitations list (honest)
