# Reach R6 — Validation Matrix

**Last updated:** 2026-08-03  

Legend: **Pass** / **Fail** / **Pending** / **N/A** / **Blocked**.  
Do not treat browser results as Android results. Do not treat API success as mobile visual success.

| Scenario | Environment | Automated | Browser | Android | Physical device | Evidence | Blocker | Stage 19 follow-up |
|---|---|---|---|---|---|---|---|---|
| Routine create→handle→public status | API + simulator + mobile unit | Pass (R6 pytest) | Pending manual | Pending | Pending | `test_r6_routine_end_to_end_journey` | Path length for native build | Physical Worker walkthrough |
| Emergency create→escalate→public status | API + simulator + mobile unit | Pass (R5/R6 pytest) | Pending manual | Pending | Pending | `test_r6_emergency_end_to_end_journey` | Path length | Physical emergency UI |
| Admin profession registration | API + mobile UI | Pass (profiles + R6) | Pending manual | Pending | Pending | `test_r6_administration_profession_journey` | — | Visual registration pass |
| Public status privacy | API | Pass | Pending manual | N/A | N/A | R6 privacy + security suites | — | Spot-check labels |
| Worker list omits contact | API + mobile unit | Pass | N/A | Pending | Pending | R6 + mobile list tests | — | Visual confirm |
| Worker detail omits PIN fields | API | Pass | N/A | Pending | Pending | R6 detail assertions | — | — |
| Routing matrix | API | Pass | N/A | N/A | N/A | `test_reach_routing.py` | — | — |
| Concurrent acknowledge | API | Pass | N/A | N/A | N/A | R6 concurrency test | — | — |
| Reach gate disabled / non-dev refuse | API settings | Pass | Pending (403 UI) | Pending | Pending | security + R6 env tests | — | — |
| Simulator labelling | Browser static | Pass (simulator tests) | Pending manual | N/A | N/A | `test_reach_simulator.py` | — | Screenshot shot list |
| Safety wording / no ambulance claim | Code + docs audit | Pass (search audit) | Pending manual | Pending | Pending | R6 checkpoint wording audit | — | Judge script review |
| Demo reset / seed | CLI development | Pass (unit guards) | N/A | N/A | N/A | `reset_reach_demo` / `seed_reach_demo` | Requires local Postgres | Operator runbook |
| Android `expo run:android` | Native | N/A | N/A | Blocked/Pending | Pending | R6 Android attempt notes | Windows OneDrive path length | Short-path rebuild |
| TalkBack / physical Samsung | Device | N/A | N/A | N/A | Pending | — | Device availability | Stage 19 a11y |

## Honest summary

- Automated API/mobile unit packaging for R6 is complete.  
- Browser judge walkthrough remains a **manual** step.  
- Android runtime / physical-device validation remain **pending** when the known path-length blocker applies.  
