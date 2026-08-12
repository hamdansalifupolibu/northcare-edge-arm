# STAGE 14 — Backend, Synchronisation and Conflict Resolution

**Status:** VALIDATED — READY FOR STAGE 15 APPROVAL  
**Canonical stage note:** also see `STAGE_14_BACKEND_SYNC.md`  
**Checkpoint:** `docs/development/STAGE_14_CHECKPOINT.md`  
**Coverage audit:** `docs/testing/STAGE_14_TEST_COVERAGE_AUDIT.md`

## Close-out summary

Stage 14 delivers FastAPI sync API + mobile sync engine/Sync Centre with PostgreSQL-backed protocol v1. Validation close-out expanded pytest from 9 → **78** cases, fixed signed-cursor delimiter bug, regenerated OpenAPI, re-ran two-device simulation with step evidence, and documented Android/Docker honesty.

## Out of scope (unchanged)

Notifications (Stage 15), live Firebase project, background sync enablement, Docker runtime on hosts without Docker Desktop, automatic clinical merge / LWW.
