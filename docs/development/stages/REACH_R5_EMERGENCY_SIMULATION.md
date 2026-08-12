# Reach Stage R5 — Emergency Coordination Simulation

**Status:** Implemented — awaiting R6 approval  
**Date:** 2026-08-03  

## Purpose

Complete the emergency demonstration journey for NorthCare Reach using existing R2 escalation and R3/R4 surfaces. Truthful simulation only — not live dispatch.

## In scope

- Emergency filter presentation and simulation wording
- Emergency card prominence (text + icon + semantic border)
- Emergency detail banner (simulation + 112 + live integration pending)
- Emergency privacy reminder
- `escalateCommunityRequest` mobile client against R2 `POST .../escalate`
- Confirmation that no ambulance is contacted
- Success / conflict / offline / timeout / capability-denial handling
- Tests, walkthrough, inventories, checkpoint

## Out of scope

- Dispatch / ambulance / telecom / SMS / GPS / maps
- Timers / auto-escalation / notifications / sounds / flashing
- Background polling / WebSockets / dispatcher dashboard
- Clinical severity / RED priority from Reach / AI
- New migration / new packages
- R6 / Stage 19

## Transition note

R2 frozen transitions allow escalate **only** from `acknowledged`. The demonstration path is therefore:

acknowledge → escalate → (optional contact attempt) → public escalated status

Contact-then-escalate is not permitted by the R2 status engine and was not implemented.

## Checkpoint

See `docs/development/REACH_R5_CHECKPOINT.md`.
