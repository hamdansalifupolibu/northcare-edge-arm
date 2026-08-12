# Checkpoint — Reach Africa's Talking USSD T0/T1 Documentation Package

**Stage package:** Reach T0 (design freeze) + T1 (webhook adapter specification)  
**Status:** T0 **APPROVED** by user (2026-08-04); T1 still planned / blocked  
**Date:** 2026-08-04  
**Scope approved:** T0 design freeze approved; T0/T1 docs package remains documentation only — **no application code**  
**Honesty label:** T0 design freeze approved. Implementation of FastAPI/webhook **not started**. Live Ghana shortcode **not** claimed or provisioned by this work.

## What was implemented

Documentation and roadmap pointers only:

- T0 design freeze for Africa's Talking as USSD partner (sandbox → Ghana-aware production path, session mapping, channel enum proposal, threat model, truthfulness, non-goals)  
- T1 stage specification for sandbox webhook adapter (gated behind T0 approval)  
- Light updates to future expansion, project status, and reach roadmap artifact  

## What was not implemented

- FastAPI webhook routes  
- Alembic / channel enum code changes  
- OpenAPI regeneration  
- ngrok configuration in the repository  
- AT dashboard provisioning (human action)  
- Live shortcode application  
- Commits  

## Files created

- `docs/development/stages/REACH_T0_AFRICAS_TALKING_DESIGN_FREEZE.md`
- `docs/development/stages/REACH_T1_AFRICAS_TALKING_WEBHOOK_ADAPTER.md`
- `docs/development/REACH_AT_USSD_T0_T1_DOCS_CHECKPOINT.md` (this file)

## Files modified

- `docs/development/NORTHCARE_REACH_FUTURE_EXPANSION.md`
- `PROJECT_STATUS.md`
- `implementation/reach-roadmap.json`

## Files deleted

- None

## Commands run

```text
Documentation write/update only (no test suite, no install, no commit)
```

## Packages installed

- None

## Results

| Check | Result |
|---|---|
| Application code changed | No |
| Database migrations | No |
| Secrets committed | No |
| Live shortcode claimed | No |
| T1 coding started | No |
| Stage discipline | T0 docs first; T1 explicitly gated |

## Design decisions captured (T0)

| # | Decision |
|---|---|
| Partner | Africa's Talking |
| Keep simulator channel | `ussdSimulator` |
| Proposed sandbox channel | `ussdAfricasTalkingSandbox` |
| Proposed live channel | `ussdAfricasTalkingLive` (post-T1; gated) |
| Menu source of truth | `NORTHCARE_REACH_USSD_FLOW.md` / `reach-ussd-flow.json` |
| Fees | Confirm current Ghana rate card with AT — no invented GHS prices |
| T1 start | Only after T0 approval |

## Known limitations

- AT help/dashboard URLs and Ghana commercial terms can change; implementers must re-check AT sources.  
- IP allowlisting depends on whether AT publishes stable egress ranges — treat as “if available”.  
- Sandbox account creation and callback URL configuration remain human steps on the AT dashboard.  

## Approval note (2026-08-04)

User approved Reach **T0** (Africa's Talking design freeze). Next: complete **AT sandbox signup** (USSD channel + callback secret policy), then explicitly **authorise T1 coding**. Do not start T1 from T0 approval alone.

## Outstanding tasks (after T0 approval)

1. ~~Approve or amend T0 decisions.~~ **Done — T0 approved 2026-08-04.**  
2. Create AT sandbox account + USSD channel; note callback secret policy.  
3. Confirm Ghana commercial / MNO path with AT when live is desired (not required for T1 sandbox coding).  
4. Explicitly authorise **T1 coding** (separate approval).  
5. Do not auto-start Stage 19 or live channel enablement.  

## Unexpected changes

- None beyond the light status/roadmap pointers listed above.

## Git status

No commit created (per instructions).

## Ready for T1 coding?

**No.** T0 is approved; T1 remains blocked until AT sandbox is ready and the user gives an explicit “start T1” / coding authorisation.
