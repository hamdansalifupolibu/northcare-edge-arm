# Assistant Urgent Request Policy

**Stage:** 13  
**Date:** 2026-08-02

## Policy

Urgent or emergency-framed requests must **not** be answered as ordinary retrieval Q&A.

Intent `emergencyOrUrgentRequest` → `urgentBoundary` (and urgent screen UX).

## Hard rules

1. **Do not invent emergency numbers.** No fabricated Ghana/local hotline digits in assistant copy or knowledge packs unless a future approved content pack explicitly supplies a reviewed number with governance.
2. **Do not assign Stage 9 RED / Amber / Green from keyword matching** in the assistant. Danger-sign colour is owned by the deterministic risk engine on visit data — not Ask NorthCare chat keywords.
3. **Do not claim dispatch.** The assistant does not call emergency services.
4. Direct the worker to approved urgent-assessment / referral procedures and authorised supervisor or emergency pathways available to them.

## UX

Route: `/(worker)/ask/urgent`  
Copy emphasises acting through approved procedures, not waiting on the assistant.

## Related

- `ASSISTANT_CLINICAL_SCOPE.md`
- Stage 9 risk docs (`RISK_ENGINE_ARCHITECTURE.md`)
