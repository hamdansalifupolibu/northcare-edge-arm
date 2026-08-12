# Repository Pattern

**Stage:** 8  
**Last updated:** 2026-08-02  

## Rule

UI and screen code must not execute SQL or import `expo-sqlite`.

## Interfaces

Defined in `apps/mobile/src/data/repositories/contracts/types.ts`:

- FacilityRepository
- LocalAccountReferenceRepository
- ClientRepository
- CaregiverRepository
- EncounterRepository
- ScreeningRepository
- MeasurementRepository
- RiskAssessmentRepository
- ReferralRepository
- NutritionAssessmentRepository
- AttachmentRepository
- SyncQueueRepository
- AuditEventRepository

## Implementations

SQLite implementations under `apps/mobile/src/data/repositories/sqlite/`, assembled by `createSqliteRepositories`.

## Errors

Typed `RepositoryError` categories: `notFound`, `duplicate`, `validation`, `constraint`, `storageUnavailable`, `migrationFailed`, `transactionFailed`, `dataIntegrity`, `conflict`, `unknown`.

Mapped via `mapSqliteError` without exposing SQL parameter values to UI.

## Provider surface

`DatabaseProvider` exposes readiness + repository container — **not** the raw connection.

## Stage 8 extensions

EncounterRepository: `findActiveDraftByClient`, `touchDraftSaved`, `markInProgress`.  
ScreeningRepository: `findByEncounterId`, `markInProgress`, `complete`, `cancel`.  
MeasurementRepository: `listByEncounter`, `listByScreening`.  

Visit multi-repo transactions live in `createVisitServices` — never in React screens.
