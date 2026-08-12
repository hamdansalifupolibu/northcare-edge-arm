# Risk Result Persistence

## Tables (Stage 6 + migration 003)

- `risk_assessments` — priority, engine/pack/template versions, acknowledgement, missing info JSON, supersession, digests  
- `risk_factors` — matched factors with rule id, priority, explanation id, sort order  

## Transactional save

Application `saveAcknowledgedResult` commits together:

1. Mark previous current superseded (if any)  
2. Insert assessment + factors  
3. Acknowledge  
4. Audit events  
5. Sync-queue pending create/update  

Nested transactions are avoided (`alreadyInTransaction`). Rollback tests cover sync-queue and insert failures.

## Sync wording

Use **Saved on this device** / **Waiting for connection** — never fake **Synced**.
