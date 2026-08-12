# Client Registration Drafts

**Stage:** 7  

## Decision

Stage 7 preserves registration state **in the active multi-step flow** (React state).

- Back/forward navigation keeps entered fields.
- Leaving with substantial unsaved content shows an abandon warning.
- Sensitive registration drafts are **not** stored in AsyncStorage or SecureStore.

## Persistent drafts

A dedicated SQLite registration-draft model was **not** added in Stage 7 because:

- In-flow preservation meets the MVP abandon-warning requirement.
- Overloading completed `clients` rows as drafts would blur record state.
- A draft migration is deferred until product confirms resume-after-kill is required.

If persistent drafts are approved later, add an explicit draft table/migration and repository — do not use AsyncStorage for client PII.
