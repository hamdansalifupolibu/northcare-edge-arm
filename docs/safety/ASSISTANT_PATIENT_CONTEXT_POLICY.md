# Assistant Patient Context Policy

**Stage:** 13  
**Date:** 2026-08-02

## Status

**PATIENT-SPECIFIC ASSISTANCE DEFERRED**

## Policy

Ask NorthCare must **not** assess, summarise, or advise on an individual named or identifiable client from assistant chat.

Detected patient-specific intents return `patientSpecificBoundary` with workflow links to Clients / Referrals / worker home — not a retrieval answer about that person.

## Deferred capabilities (explicitly not Stage 13)

- Injecting open client record context into prompts or retrieval
- “What should I do for this client?” answers from chart data
- Auto-reading visit/screening/nutrition results into the assistant
- Cross-linking assistant answers into clinical record fields without separate worker confirmation flows

## Why deferred

Patient-specific assistance raises privacy, grounding, and clinical-safety risks that require dedicated design, consent, and evaluation beyond retrieval-only general reference.

## Worker guidance copy (summary)

Individual client assessment is unavailable in Ask NorthCare. Use approved screening, priority, and referral workflows, or consult the authorised clinical supervisor.

## Related

- `ASSISTANT_CLINICAL_SCOPE.md`
- `docs/security/ASSISTANT_QUERY_PRIVACY.md`
