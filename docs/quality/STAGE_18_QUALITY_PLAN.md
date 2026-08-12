# Stage 18 — Quality Plan

**Updated:** 2026-08-02

## Objectives

1. Evidence-based security and accessibility hardening  
2. Keep Stages 1–17 behaviour intact  
3. Honest limitation reporting  
4. Exit ready for Stage 19 testing — not production

## Quality gates

- Mobile typecheck / lint / tests / expo-doctor  
- Backend ruff / mypy / pytest (incl. PG integration)  
- Secret scan clean of true positives  
- Dependency audit documented  
- Android development build attempted with exact blocker if any  
- Documentation + inventories updated  

## Change control

All code changes classified in `STAGE_18_CHANGE_REGISTER.md`.
