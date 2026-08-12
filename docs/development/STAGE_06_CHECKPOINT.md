# Stage 6 Checkpoint

**Stage:** 6 — Domain Models, SQLite and Repository Layer  
**Status:** COMPLETE — ready for Stage 7 approval  
**Date:** 2026-08-02  

| Field | Result |
|---|---|
| Persistence audit | Documented in `DATA_ARCHITECTURE.md` — no prior clinical SQLite; auth SecureStore separated; AsyncStorage non-clinical |
| Expo SQLite version | ~57.0.1 |
| SQLite API selected | Current async API (`openDatabaseAsync` / `runAsync` / `withTransactionAsync`) — not WebSQL |
| Dependency-health result | React 19.2.3 deduped; react-dom absent; Expo Doctor 20/20; see `DEPENDENCY_HEALTH.md` |
| Database filename | `northcare.db` |
| Database location | App sandbox via Expo SQLite |
| Current schema version | 1 |
| Migrations created | `001_initial_schema` |
| Migration-test result | Pass |
| Foreign-key result | Pass (enforced in tests) |
| WAL or journal-mode decision | WAL enabled for on-disk DBs; skipped for in-memory tests |
| Tables created | schema_migrations, app_metadata, audit_events, facilities, local_account_references, clients, caregivers, client_relationships, encounters, screenings, screening_answers, measurements, risk_assessments, risk_factors, referrals, referral_events, nutrition_assessments, attachments, sync_queue_items |
| Tables deferred | knowledge articles, language assets, notifications |
| Domain entities created | Facility, LocalAccountReference, Client, Caregiver, ClientRelationship, Encounter, Screening, ScreeningAnswer, Measurement, RiskAssessment, RiskFactor, Referral, ReferralEvent, NutritionAssessment, Attachment, SyncQueueItem, AuditEvent |
| Repository interfaces created | 13 (facility → audit) |
| SQLite repositories created | 13 |
| Transaction system | `SqliteDriver.withTransactionAsync` + `DatabaseManager.withTransaction` |
| Repository error model | Typed `RepositoryError` + `mapSqliteError` |
| Database provider | Readiness idle/opening/migrating/ready/failed; repos container; retry; dev reset |
| Startup integration | LaunchProvider waits for DB ready; truthful opening/migrating splash copy |
| Synthetic fixtures | `syntheticSeed.ts` — production gated |
| Development diagnostics | `/(development)/database-preview` |
| Database reset result | Dev-only, confirmation required, migrations reapplied |
| Data-classification result | `DATA_CLASSIFICATION.md` |
| Database-security result | Sandbox only; no SQLCipher claim |
| Soft-deletion result | Implemented + tested |
| Sync metadata result | Standard fields + statuses |
| Sync-queue foundation | Schema + repository (no networking) |
| Audit-event foundation | Sanitised metadata + prohibited-field rejection |
| Attachment foundation | Metadata only; encryptionStatus=`none` |
| Packages installed | `expo-sqlite@~57.0.1` |
| Reason for each package | Local offline structured storage (SDK 57) |
| Type-check result | Pass |
| Lint result | Pass |
| Test result | Pass (124 tests, including data suites) |
| Expo Doctor result | 20/20 pass |
| Android emulator result | `emulator-5554` **offline** — blocker documented |
| Android SQLite runtime result | Pending |
| Performance baseline | Node/Jest only — labelled non-device |
| Privacy review | No health details in logs; secrets not in SQLite |
| Known limitations | Emulator offline; no DB encryption; no network sync; scrypt device benchmarks pending |
| Git status | No Stage 6 commit without approval |
| Recommended Stage 7 scope | Client management vertical slice |
| Approval required | Yes — before Stage 7 |

## Stage 5 security follow-up (not production-approved)

scrypt N=2^15, r=8, p=1, dkLen=32 Node-benchmarked ~355 ms. Still needs Android emulator + Samsung S20 Ultra + lower-spec device benchmarks before production approval.
