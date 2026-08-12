# NorthCare Reach — Future Expansion Roadmap

**Status:** Out of MVP — do not implement without explicit approval  
**Last updated:** 2026-08-04  

Do **not** promise dates or partnerships that do not exist.

## Phase 1 — Current prototype (R0–R6)

- USSD simulation  
- Community-request backend  
- Profession routing  
- Worker request centre  
- Emergency simulation  
- Demo reset / seed / runbook packaging  

## Phase 2 — Partner sandbox

Primary USSD aggregator path:

| Stage | Name | Status | Spec |
|---|---|---|---|
| **T0** | Africa's Talking USSD design freeze | **Approved** (2026-08-04) | `docs/development/stages/REACH_T0_AFRICAS_TALKING_DESIGN_FREEZE.md` |
| **T1** | Africa's Talking webhook adapter (sandbox) | **Complete — awaiting checkpoint approval** | `docs/development/stages/REACH_T1_AFRICAS_TALKING_WEBHOOK_ADAPTER.md` · checkpoint `docs/development/REACH_T1_AFRICAS_TALKING_CHECKPOINT.md` |

Docs package checkpoint: `docs/development/REACH_AT_USSD_T0_T1_DOCS_CHECKPOINT.md`.  
Sandbox runbook + demo-day playbook: `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`.

Phase 2 inventory (broader):

- USSD gateway via Africa's Talking (T0/T1 sandbox)  
- Stable hosted API callback for demos (ops; preferred over laptop tunnels)  
- SMS (separate stage — not claimed)  
- Hosted development endpoint  
- Webhook verification  
- Delivery receipts  
- Rate limiting  
- Optional future: expand community USSD Ask NorthCare beyond the current **FAQ-only** hackathon pack (new approved stage required for generative/LLM answers; privacy-safe; no diagnose/prescribe/dosage; English unless reviewed translations; rate limits; LLM latency vs ~10s USSD timeout — still high risk). Current menu **7** is approved FAQ templates + worker handoff only. Worker Ask NorthCare in the mobile app remains separate and already exists offline.

## Phase 3 — Controlled pilot

- Approved health content  
- Approved language content  
- Facility routing  
- Operational response procedures  
- Worker training  
- Privacy and clinical review  

## Phase 4 — Service partnerships

- Telecom integration  
- Ghana Health Service integration  
- National Ambulance Service integration  
- District coordination  
- Production identity  
- Operational monitoring  

## Explicit non-MVP inventory (still future)

- Real USSD shortcode / telecom aggregator / network billing  
- Live ambulance confirmation exchange  
- GPS / telecom-assisted location / catchment maps  
- Worker duty rosters / workload balancing / automatic escalation timers  
- Dispatcher dashboard  
- Real-time remote push  
- AI translation / AI request summarisation / unrestricted public chatbot  
- Profession / licence verification  
- Reviewed Dagbanli / Hausa / Dagaare clinical translations  
- National deployment / public production hosting  

## Reminder

MVP rule: build the complete demonstration story, not the complete national infrastructure.
