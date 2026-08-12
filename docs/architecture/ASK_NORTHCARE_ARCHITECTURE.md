# Ask NorthCare Architecture

**Stage:** 13  
**Date:** 2026-08-02  
**Status:** Implemented (retrieval-only)

## Overview

Ask NorthCare is a **constrained, offline-first assistant** for authorised frontline workers. Stage 13 answers general care-reference questions by retrieving approved knowledge-pack articles and composing answers from those blocks only. It does **not** diagnose, prescribe, calculate dosage, or assess individual clients.

## Honest runtime posture

| Concern | Stage 13 reality |
|---|---|
| Answer path | **Retrieval-only** composition |
| Pilot knowledge packs | **0** `APPROVED_FOR_PILOT` — production fails closed |
| Development packs | **1** synthetic `APPROVED_FOR_DEVELOPMENT` |
| Generative provider | Interface only — **unavailable** |
| On-device LLM | **Deferred** — no packages installed |
| Local search | TypeScript inverted index (`SEARCH_INDEX_VERSION=1`) |
| SQLite FTS5 | **Not used / not verified** |
| Schema | Migration **007** — feedback/issues metadata only |
| Conversation | In-memory unlocked session; cleared on lock/logout |

## Feature layout

```text
apps/mobile/src/features/assistant/
├── application/createAssistantServices.ts
├── content/          # Bundled TypeScript knowledge packs + registry
├── domain/           # Modes, intents, policies, types
├── retrieval/        # Tokenise, index, rank, coverage
├── response/         # Retrieval-only composer + fallbacks
├── providers/
│   ├── retrievalOnly/
│   ├── development/
│   └── futureGenerative/   # Interface stub — unavailable
├── session/          # In-memory conversation store
├── screens/          # Ask home, topics, answer, sources, …
├── components/
└── __tests__/
```

Routes (worker, auth-gated): `/(worker)/ask/*`  
Development preview: `/(development)/ask-northcare-preview`

## Request flow

```text
question → intent classify → (boundary | retrieve → coverage → compose) → UI
```

1. Classify intent (patient-specific, diagnosis, urgent, general, …).
2. Boundary intents return fixed safety copy — no retrieval answer.
3. General questions search loadable packs via inverted index.
4. Coverage gate (`COVERAGE_SCORE_THRESHOLD=50`) fail-closes weak matches.
5. Composer emits approved article blocks + citations only.

## Content gates

| Gate | Production / staging | Development |
|---|---|---|
| Knowledge packs | `APPROVED_FOR_PILOT` only (**0**) | + `APPROVED_FOR_DEVELOPMENT` (1 synthetic) |

## Persistence

- Knowledge: bundled TypeScript modules — **not** AsyncStorage or SQLite article storage.
- SQLite (v7): `assistant_feedback`, `assistant_content_issues` only.
- No unrestricted chat-history tables; no raw question columns in SQLite.

## Cross-stage boundaries

- Does not write clinical records, risk results, or referrals.
- Does not call ASR/LLM packages.
- Deterministic Stage 9 danger-sign engine remains the primary safety path for visits — not this assistant.

## Related

- `ASSISTANT_MODE_DECISION.md`
- `ASSISTANT_LOCAL_RETRIEVAL.md`
- `ASSISTANT_ANSWER_COMPOSITION.md`
- `docs/safety/ASSISTANT_CLINICAL_SCOPE.md`
- `implementation/assistant-knowledge-pack-inventory.json`
