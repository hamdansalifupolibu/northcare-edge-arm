# Reach R3 — Test Strategy

**Stage:** R3 USSD Simulator  
**Date:** 2026-08-03

## Approach

No new JavaScript test framework. Use backend pytest plus static-file string audits.

## Automated coverage

| Area | Location |
|---|---|
| Route gating (disabled / enabled) | `tests/integration/test_reach_simulator.py` |
| Staging/production settings fail-closed | same + existing security tests |
| Static labels, menu, 112, simulation wording | static content audits |
| Forbidden ambulance / storage / eval / external scripts | static content audits |
| Same-origin R2 path usage | static JS audit |
| Create + status via R2 API | integration test |
| OpenAPI includes simulator routes | `tests/contract/test_protocol_contract.py` |

## Manual

Documented in `docs/testing/REACH_R3_MANUAL_WALKTHROUGH.md` (Flows A–F).

## Out of scope

Playwright / Cypress / Selenium not added for R3.
