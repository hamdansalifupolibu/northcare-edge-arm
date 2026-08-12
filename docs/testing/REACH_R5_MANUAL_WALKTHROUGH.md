# Reach R5 — Manual Walkthrough

**Date:** 2026-08-03  
**Android runtime:** Blocked — Windows path length (>260) under deep OneDrive path (known Stage 18 blocker)  
**Evidence substitutes:** R3 simulator browser + mobile unit tests + API integration `test_reach_r5_emergency_journey.py`  

## Steps (operator checklist)

1. [ ] Enable Reach demo gate in development
2. [ ] Open `/reach-simulator`
3. [ ] Select Emergency help now — 112 instruction visible immediately
4. [ ] Submit synthetic contact + landmark with consent
5. [ ] Receive reference + one-time PIN (memory only)
6. [ ] Sign in development worker — Worker workspace
7. [ ] Open Community Requests → Emergency filter
8. [ ] Confirm filter heading + simulation + live integration not active
9. [ ] Open request — banner: Emergency coordination simulation + 112 + pending
10. [ ] Acknowledge
11. [ ] Escalate — confirmation says no ambulance contacted
12. [ ] Success: Request escalated for further support
13. [ ] Optional contact attempt after escalate
14. [ ] Simulator status check → **Escalated for further support** only
15. [ ] Confirm no ambulance / severity / RED PRIORITY wording

## Synthetic data only

Do not use real emergency incidents, passwords in screenshots, or reusable PIN captures.

## Result

Automated journey passes. Physical Android walkthrough **pending** due to path-length blocker.
