# NorthCare Reach — Emergency Coordination Runbook (R5)

**Last updated:** 2026-08-03  
**Audience:** Demo operators and developers  

## Preconditions

- `NORTHCARE_REACH_DEMO_ENABLED=true` and `NORTHCARE_ENV=development` (or test)
- Development dual-role worker with `communityHealthOfficer`, community + emergency enabled
- Worker workspace (not Administration)

## Emergency demo path (R2-correct)

1. Open R3 simulator (`GET /reach-simulator`)
2. Select `0. Emergency help now` — confirm call-112 instruction
3. Submit synthetic landmark + callback with consent
4. Note reference + one-time status PIN (do not screenshot PIN for reuse)
5. Worker → Community Requests → Emergency filter
6. Open request — confirm simulation banner
7. Acknowledge
8. **Escalate** (from acknowledged) — confirm “will not contact or dispatch an ambulance”
9. Confirm status **Escalated for further support**
10. Optional: Record contact attempt (allowed after escalate)
11. Simulator status check — only generic escalated label

## Truthfulness

- No ambulance is contacted
- No automatic escalation or timers
- No push / sound / flashing
- Escalate requires explicit worker confirmation

## Blockers

Android physical walkthrough may be blocked by Windows path length under OneDrive — record pending if so.
