# NorthCare Reach — Hackathon MVP Definition

**Status:** Frozen by Reach Stage R0; **R1–R6 implemented/packaged**  
**Last updated:** 2026-08-03  
**Track:** NorthCare Reach (hackathon extension)  
**Core app stages:** 1–18 complete; **Stage 19 paused** until Reach R6 manual validation approval  

## Purpose

NorthCare Reach demonstrates one complete product story:

Basic-phone user → simulated USSD → community request submitted → profession-based assignment → request appears in the health-worker app → worker acknowledges and handles → community member checks a privacy-safe status.

It is **not** national telecom infrastructure, a national emergency-dispatch platform, a production clinical helpline, a public medical chatbot, or a complex staff-allocation engine.

**Central rule:** Build the complete story, not the complete national infrastructure.

## Five connected MVP capabilities

1. Simulated USSD interface  
2. Community Request backend  
3. Profession information in administrator worker registration  
4. Community Requests Centre in the Worker workspace  
5. Emergency-coordination simulation  

The simulator submits synthetic requests to the development backend. Request handling, status changes, worker Community Requests Centre, and emergency escalation simulation are implemented through R5 and packaged for demonstration in R6. Telecom and ambulance integrations remain future work (not active).

## Final USSD main menu (frozen)

```text
NORTHCARE REACH

0. Emergency help now
1. Pregnancy and newborn care
2. Child health
3. Nutrition
4. Request a CHPS worker
5. Check a request or follow-up
6. Language
```

No additional main-menu options in the MVP. Submenus support `0. Emergency help` and `9. Back` where the session design permits.

## Simulator label (mandatory)

- **NorthCare Reach USSD simulation**  
- **Live telecom integration pending**

The simulator must not claim a live shortcode, connected telecom gateway, active SMS, network billing, a real ambulance contact, or a real CHPS facility receipt.

## Controlled enums (frozen)

| Concern | Values |
|---|---|
| Categories | `pregnancyNewborn`, `childHealth`, `nutrition`, `generalChps`, `referralFollowUp`, `emergency` |
| Request types | `routine`, `urgentContact`, `emergencyAssistance` |
| Statuses | `received`, `assigned`, `acknowledged`, `contactAttempted`, `escalated`, `handled`, `cancelled` |
| Channel (MVP) | `ussdSimulator` |

Request types describe pathway, not medical severity. Do not use mild / moderate / severe / critical as public or automated medical classifications.

## Must build for the demo

- Profession + community/emergency enablement in admin registration  
- Professional profile for the development dual-role account  
- Community request model, create, reference + PIN, generic status lookup  
- Deterministic assignment  
- USSD simulator  
- Worker Community Requests Centre and actions (acknowledge, contact attempt, escalate, mark handled)  
- Emergency simulation (truthful wording)  
- Routine + emergency demonstration journeys  
- Synthetic reset, tests, documentation  

## Future expansion (not R1–R6 without approval)

Real USSD/SMS/telecom, live ambulance / NAS exchange, GPS, district/catchment routing, duty rosters, workload balancing, automatic escalation timers, dispatcher dashboard, remote push, licence/profession verification, real translations / AI translation / AI summarisation, production clinical packs, GHS production integration, national deployment, public production hosting.

See `docs/development/NORTHCARE_REACH_FUTURE_EXPANSION.md`.

## Implementation stages

| Stage | Name |
|---|---|
| R0 | Scope, Safety and Design Freeze (**this stage**) |
| R1 | Worker Profession and Admin Integration |
| R2 | Community Request Backend and Routing |
| R3 | USSD Simulator |
| R4 | Worker Community Requests Centre |
| R5 | Emergency Coordination Simulation |
| R6 | Integration, Testing and Demonstration Preparation |

Do not start R1 or Stage 19 without explicit approval.

## Related artifacts

- Flows: `docs/product/NORTHCARE_REACH_USSD_FLOW.md`, `implementation/reach-ussd-flow.json`  
- Domain: `docs/architecture/COMMUNITY_REQUEST_DOMAIN_MODEL.md`  
- Routing: `docs/architecture/COMMUNITY_REQUEST_ROUTING_POLICY.md`  
- Profession: `docs/architecture/WORKER_PROFESSIONAL_PROFILE.md`  
- Safety / privacy / public endpoints under `docs/safety/` and `docs/security/`  
- Roadmap: `implementation/reach-roadmap.json`  
