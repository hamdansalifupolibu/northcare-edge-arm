# Assistant Content Versioning

**Stage:** 13  
**Date:** 2026-08-02

## Version dimensions

| Dimension | Where | Notes |
|---|---|---|
| Knowledge pack | `knowledgePackId` + `version` | Bundled TypeScript pack |
| Article | Article id + pack version | Answers cite pack version |
| Search index | `SEARCH_INDEX_VERSION = 1` | Retrieval index generation |
| Retrieval engine | `RETRIEVAL_ENGINE_VERSION = 1` | Ranking/coverage logic |
| Response composer | `RESPONSE_COMPOSER_VERSION = 1` | Block assembly |
| Provider policy | `ASSISTANT_PROVIDER_POLICY_VERSION = 1` | Provider selection rules |
| Content checksum | Pack `contentChecksum` | Validated at load |

## Content statuses

`DRAFT`, `REVIEW_REQUIRED`, `APPROVED_FOR_DEVELOPMENT`, `APPROVED_FOR_PILOT`, `RETIRED`

Registry load rules:

- **Production / staging:** `APPROVED_FOR_PILOT` only
- **Development:** `APPROVED_FOR_DEVELOPMENT` + `APPROVED_FOR_PILOT`

## Stage 13 counts

| Status | Count |
|---|---|
| `APPROVED_FOR_PILOT` | **0** |
| `APPROVED_FOR_DEVELOPMENT` | **1** (`synthetic-dev-ask-northcare-v1`) |

## Historical answers

Answers shown in-session carry pack id/version stamps. Conversation is not durable across lock/logout, so long-term historical answer replay is not a Stage 13 requirement.

Retired articles remain addressable for in-session article view when already resolved; new retrieval should not prefer retired content for new questions.

## Inventories

- `implementation/assistant-knowledge-pack-inventory.json`
- `implementation/assistant-provider-inventory.json`

## Pilot readiness

Do not invent clinical review names or approval dates. Production remains unavailable until pilot-approved packs exist.
