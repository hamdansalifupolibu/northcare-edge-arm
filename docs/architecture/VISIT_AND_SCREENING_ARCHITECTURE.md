# Visit and Screening Architecture

**Product:** NorthCare AI  
**Stage:** 8  
**Last reviewed:** 2026-08-02

## Boundaries

| Layer | Responsibility |
|---|---|
| Screens (`features/visits/screens`) | UX only — never SQL / SQLite / sync-queue |
| Application services (`createVisitServices`) | Multi-repo transactions and use cases |
| Repositories | Persistence for encounters, screenings, answers, measurements, audit, sync queue |
| Template engine (`features/screening/engine`) | Visibility, progress, required-item checks — no eval |
| Content registry | Governance-gated template loading |

## Use cases

StartVisit, GetVisitDraft, SaveVisitDraft, ResumeVisit, RecordScreeningAnswer, RecordMeasurement, ReviewScreening, CompleteScreening, AbandonVisit, GetClientVisitHistory, GetVisitDetails, CorrectVisitRecord.

## Safety

- Unknown ≠ No; Not assessed ≠ No; unanswered ≠ No
- No clinical answer defaults
- No normal/abnormal/safe/dangerous labels
- Completion copy: Visit recorded / Screening information saved
- Sync copy: Saved on this device / Waiting for connection
- Routes: UUID client/visit ids only
- Production loads `APPROVED_FOR_PILOT` only

## Deferred

Deterministic risk/priority (Stage 9), referrals, nutrition, voice, AI, network sync.
