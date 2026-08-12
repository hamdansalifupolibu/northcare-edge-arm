# Assistant Conversation State

**Stage:** 13  
**Date:** 2026-08-02  
**Status:** Implemented

## Decision

Conversation state is **in-memory for the unlocked session only**.

Implementation: `apps/mobile/src/features/assistant/session/assistantConversationStore.ts`

## Held in memory

- Draft question text
- Selected topic id
- Last ask result
- Results keyed by answer id (for answer/sources navigation within session)

## Cleared when

- App lock
- Logout
- Change account
- Explicit `clearAssistantConversation()` (also used in tests)

Auth session provider calls clear on lock/logout paths.

## Not persisted

- No SQLite chat-history table
- No AsyncStorage conversation transcript
- Draft question is cleared after processing by default
- Raw questions are not stored as durable clinical records

## Feedback vs conversation

Worker feedback/issues may persist as metadata in SQLite (`assistant_feedback`, `assistant_content_issues`) without storing the full chat transcript or unrestricted free-text Q&A history.

## Privacy implication

Leaving the device locked or signing out drops in-session assistant UI state. Relocking does not restore prior draft questions or answers from durable storage.

## Related

- `docs/security/ASSISTANT_QUERY_PRIVACY.md`
- `docs/security/ASSISTANT_DATA_PRIVACY.md`
