# STAGE 14 — Backend, Synchronisation and Conflict Resolution

**Status:** VALIDATED — READY FOR STAGE 15 APPROVAL  
**Prerequisites:** Stage 13 complete  
**Next stage:** Stage 15 — Notifications (do not start until approved)  
**Checkpoint:** `docs/development/STAGE_14_CHECKPOINT.md`  
**Coverage audit:** `docs/testing/STAGE_14_TEST_COVERAGE_AUDIT.md`  
**Also:** `STAGE_14_BACKEND_SYNC_CONFLICTS.md`

## Purpose

Introduce the first real network path and server-side data authority for NorthCare AI while preserving local-first offline behaviour.

## In scope

- FastAPI foundation under `services/api/`
- PostgreSQL + Alembic
- Token verification boundaries (Firebase / development / unavailable)
- Versioned sync protocol v1
- Mobile sync transport + engine + Sync Centre
- Idempotent push, cursor-based pull, soft-delete sync
- Scope enforcement and conflict detection/persistence/controlled resolution
- Docker Compose local stack (api + postgres)
- Backend and mobile tests; two-device simulation
- Documentation and checkpoint

## Out of scope

- Public registration, production Firebase project creation, admin account UI
- Push/SMS notifications (Stage 15)
- Live facility availability, real cross-device QR trust
- Production attachment/audio upload, production content-pack publishing
- Analytics, clinical-content approval, real patient data
- Automatic conflict overwrite / clinical merge / blind LWW
- Cloud deployment, production monitoring, full DR
- Website / Next.js

## Hard rules

- Offline remains default; app opens local records without backend
- Never silently discard unsynced clinical work
- Never silently overwrite newer server data
- No mark-synced before ACK; no cursor advance before local apply
- No regenerating operation IDs on retry
- Production identity unavailable → fail closed
- Firestore is not the sync DB
