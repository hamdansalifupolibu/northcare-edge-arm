# Assistant Local Retrieval

**Stage:** 13  
**Date:** 2026-08-02  
**Status:** Implemented

## Engine

TypeScript **inverted index** built at runtime from loadable knowledge-pack articles.

| Constant | Value |
|---|---|
| `SEARCH_INDEX_VERSION` | `1` |
| `RETRIEVAL_ENGINE_VERSION` | `1` |
| `COVERAGE_SCORE_THRESHOLD` | `50` |
| `COVERAGE_TOKEN_RATIO` | `0.4` |

Location: `apps/mobile/src/features/assistant/retrieval/`

Pipeline: normalise → tokenise → index lookup → rank → coverage evaluation.

## FTS5 status

SQLite **FTS5 is not assumed, not used, and not verified** for Ask NorthCare in Stage 13.

Do not document FTS5 as the retrieval backend. Schema migration 007 does not create FTS virtual tables.

## Coverage fail-closed

Weak matches do not become answers:

- Empty candidates → `unsupportedTopic`
- Score below `COVERAGE_SCORE_THRESHOLD` (unless exact question match) → `insufficientCoverage`
- Multiple strong peers → `multipleRelevantSources` (UI presents choices; no invented merge)

## Match kinds

Exact question matches and keyword/phrase token hits are ranked. Exact matches may bypass the numeric threshold path; non-exact matches require both score and token-ratio gates.

## Offline

Retrieval is fully local. No network call is required to search or compose retrieval-only answers.

## Related

- `ASSISTANT_ANSWER_COMPOSITION.md`
- `ASK_NORTHCARE_ARCHITECTURE.md`
