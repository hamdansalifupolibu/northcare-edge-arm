# STAGE 8 — Visits and Guided Screening

**Status:** COMPLETE (awaiting Stage 9 approval)  
**Date:** 2026-08-02  
**App:** `apps/mobile/` (Expo SDK ~57)

## Purpose

Record offline visits and complete schema-driven guided screening with draft save/resume, review, and explicit completion — without medical priority, danger-sign rules, diagnosis, or cloud sync.

## Included

- Start visit with existing-draft detection (resume / review / discard)
- Synthetic development screening template (clearly labelled NOT CLINICAL GUIDANCE)
- Typed template engine + visibility conditions (no eval / JSON-rules engine)
- Answer states: answered / unknown / notAssessed / declined / notApplicable / skippedByCondition
- Measurements via MeasurementRepository (controlled units; no interpretation)
- Draft persistence in SQLite; save on section continue / save & exit
- Review before complete; transactional completion + audit + sync queue
- Provisional correction with audit history
- Protected worker routes under `clients/[clientId]/visits/...`
- Dev-only screening template preview route
- Client profile Start visit + visit history (no fake risk/referrals)

## Excluded (hard stop)

- Medical priority (RED/AMBER/GREEN) — Stage 9
- Danger-sign rules, diagnosis, treatment, medication/dosage, referral recommendations
- Nutrition, voice, AI, cloud sync networking, notifications, admin management
- Invented clinical questions/thresholds or Dagbanli translations
- Website / Firebase / Firestore / FastAPI

## Packages

None added.

## Exit

Ready for Stage 9 approval — Deterministic Risk and Priority Engine. Do not start Stage 9 without approval.

## Clinical content gap

Pilot-ready clinical screening content is **outstanding**. Stage 8 may be complete with engine + workflow done while production has **zero** `APPROVED_FOR_PILOT` templates. Do not invent unsafe clinical content to fill this gap.
