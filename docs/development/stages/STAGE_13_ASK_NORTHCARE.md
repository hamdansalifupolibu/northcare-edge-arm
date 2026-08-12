# STAGE 13 — Ask NorthCare Constrained Assistant

**Status:** COMPLETE (implementation)  
**Date:** 2026-08-02  
**App:** `apps/mobile/` (Expo SDK 57)

## Purpose

Offline constrained assistant for general care-reference questions using **curated retrieval** (or unavailable). Production fails closed without pilot-approved knowledge packs. No generative model activation.

## Included

- Feature root `apps/mobile/src/features/assistant/`
- Modes: `CURATED_RETRIEVAL` | `CONSTRAINED_GENERATION` | `DEVELOPMENT_SIMULATION` | `UNAVAILABLE`
- Stage 13 runtime: curated retrieval or unavailable
- Bundled TypeScript knowledge packs + registry gates
- TypeScript inverted-index retrieval (`SEARCH_INDEX_VERSION=1`, `COVERAGE_SCORE_THRESHOLD=50`)
- Retrieval-only answer composer
- Safety intent boundaries (patient-specific, diagnosis, treatment, medication/dosage, urgent, privacy)
- In-memory conversation cleared on lock/logout
- Feedback / content-issue SQLite tables via migration **007** (schema v7)
- Worker routes under `/(worker)/ask/*` + development preview
- Provider inventory: retrieval implemented; generative interface unavailable; on-device deferred
- **Zero** new npm packages

## Explicitly excluded

- `APPROVED_FOR_PILOT` knowledge packs (count: **0**)
- Active constrained generation / remote LLM
- On-device model packages (llama, ONNX, etc.)
- SQLite FTS5 as assumed backend (not used/verified)
- Patient-specific chart assistance
- Invented emergency numbers; RED from keyword matching
- Stage 14 and later

## Content gates

| Gate | Production | Development |
|---|---|---|
| Knowledge packs (`APPROVED_FOR_PILOT`) | **0** — unavailable | 1 synthetic `APPROVED_FOR_DEVELOPMENT` (`synthetic-dev-ask-northcare-v1`) |

## Architecture pointers

- Architecture: `docs/architecture/ASK_NORTHCARE_ARCHITECTURE.md`
- Mode decision: `docs/architecture/ASSISTANT_MODE_DECISION.md`
- Storage: `docs/architecture/ASSISTANT_KNOWLEDGE_STORAGE.md`
- Retrieval: `docs/architecture/ASSISTANT_LOCAL_RETRIEVAL.md`
- Safety: `docs/safety/ASSISTANT_*.md`
- Inventories: `implementation/assistant-*-inventory.json`
- Migration: `apps/mobile/src/data/database/migrations/007_assistant_feedback.ts`

## Packages added

**None.**

## Acceptance met (summary)

- [x] Retrieval-only architecture with fail-closed production content gate
- [x] Generative provider interface only (`available: false`)
- [x] On-device model deferred; no LLM packages
- [x] In-memory conversation cleared on lock/logout
- [x] Schema migration 007 for feedback/issues only
- [x] Safety boundaries for diagnosis/treatment/urgent/patient-specific
- [x] Development synthetic pack labelled
- [ ] Physical Android validation — **PENDING** (emulator offline)

## Exit

Await checkpoint approval. Do **not** start Stage 14.

## Next stage (do not start)

**STAGE 14** — **NOT approved**; do not implement.
