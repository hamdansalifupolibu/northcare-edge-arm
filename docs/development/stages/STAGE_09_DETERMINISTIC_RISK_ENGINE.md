# STAGE 9 — Deterministic Risk and Priority Engine

**Status:** COMPLETE (awaiting Stage 10 approval)  
**Date:** 2026-08-02  
**App:** `apps/mobile/` (Expo SDK ~57)

## Purpose

Implement a deterministic, versioned, explainable priority-evaluation engine (red / amber / green / undetermined) against approved rule packs — without diagnosis, treatment, referral creation, or AI classification.

## Included

- React-independent engine (`RISK_ENGINE_VERSION = 1`)
- Typed rule packs with governance statuses and production fail-closed gates
- Synthetic development pack only (`APPROVED_FOR_DEVELOPMENT`)
- Condition operators, aggregation (`highestApprovedPriorityWins`), explainability fragments
- Persistence via Stage 6 `risk_assessments` / `risk_factors` (+ migration 003 fields)
- Worker acknowledgement, supersession / recalculation history
- Result screens + development preview route
- Mandatory unit / persistence / rollback / security / UI tests

## Excluded (hard stop)

- Diagnosis, disease prediction, treatment, medication/dosage
- Referral creation / QR passport — Stage 10
- Real clinical danger-sign packs (`APPROVED_FOR_PILOT` count = 0)
- LLM / generative AI / eval / string JS conditions
- Voice, nutrition, cloud sync, notifications, admin workflows
- Manual priority override (deferred — governance required)

## Packages

None added.

## Clinical content gap

Stage 9 may be complete with engine + synthetic packs while **zero** `APPROVED_FOR_PILOT` packs exist. Production builds must show “Priority assessment unavailable” and must not fall back to synthetic rules.

## Exit

Ready for Stage 10 approval — Referrals and QR Referral Passport. Do not start Stage 10 without approval.
