# Reach R6 — Test Strategy

**Last updated:** 2026-08-03  

## Goal

Prove the packaged R0–R5 Reach story with automated journeys and an honest validation matrix. Do not introduce a large new E2E framework.

## Automated coverage

| Journey | Location | Notes |
|---|---|---|
| Routine E2E | `tests/integration/test_reach_r6_demo_journeys.py` | create→ack→contact→handle→public |
| Emergency E2E | same + `test_reach_r5_emergency_journey.py` | ack→escalate→public |
| Administration profession | R6 admin test + `test_professional_profiles.py` | fixed worker role + profile |
| Privacy | R6 privacy test + `tests/security/test_reach_security.py` | public generic fields only |
| Concurrency | R6 + `test_reach_lifecycle.py` | single successful acknowledge |
| Environment gate | R6 + security tests | default off; staging/prod refuse |
| Routing / no-match | `test_reach_routing.py` | frozen matrix |
| Failure injection | `test_reach_failure_injection.py` | no false success |
| Mobile workflow | `apps/mobile/.../community-requests/__tests__` | client + actions + guards |
| CLI guards | `tests/unit/test_reach_demo_cli.py` | reset/seed refuse non-dev |

## Manual coverage

See `REACH_R6_VALIDATION_MATRIX.md` for browser / Android / physical distinctions.

## Out of scope for R6 automation

- Physical Samsung device walkthrough  
- Live telecom / SMS / ambulance  
- Stage 19 release packaging  
