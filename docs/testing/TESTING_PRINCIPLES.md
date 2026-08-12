# Testing Principles

**Purpose:** Establish when and how testing grows with the product.  
**Status:** Active  
**Last reviewed:** 2026-08-02  

## Principle

Testing begins with implementation stages and is **not** postponed to the final stage.

## Future layers

- Static checks · Type checking · Linting  
- Unit tests · Component tests  
- Repository tests · SQLite migration tests  
- Rule-engine safety tests  
- Navigation tests · Integration tests  
- Offline tests · Sync / conflict tests  
- Notification tests · Accessibility checks  
- Android emulator tests · Physical-device tests  
- End-to-end demonstration tests  

## Stage expectation

Each stage declares mandatory tests in its specification and in `docs/testing/TEST_STRATEGY.md`. Safety-critical logic (risk rules, auth gates, sync idempotency) gets automated tests first.
