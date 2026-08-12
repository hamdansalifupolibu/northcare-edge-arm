# Assistant Query Privacy

**Stage:** 13  
**Date:** 2026-08-02

## Classification

Worker questions may contain **sensitive health or identifying details**. Treat query text as sensitive.

## Storage rules

- Draft/result state: **in-memory only**; cleared on lock/logout.
- Do **not** persist raw questions as durable SQLite chat history.
- Feedback tables store categories / optional notes / article+pack ids — not unrestricted conversation logs.

## Logging prohibitions

Do not log:

- Full question text
- Patient names, phone numbers, or identifiers from queries
- Full answer payloads in production diagnostics
- Tokens, PINs, or credentials

Audit events may record coarse event types/metadata without embedding raw query content.

## Intent privacy gate

`privacySensitiveQuestion` → `privacyReviewRequired`: ask the worker to remove identifying details and reword as a general care-reference question.

## Network

Stage 13 retrieval does not send queries to a remote LLM. Future remote providers remain unavailable and would require a separate privacy review.

## Related

- `ASSISTANT_DATA_PRIVACY.md`
- `docs/architecture/ASSISTANT_CONVERSATION_STATE.md`
