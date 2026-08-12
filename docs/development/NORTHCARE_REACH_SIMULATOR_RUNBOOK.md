# NorthCare Reach — Simulator Runbook (R3)

## Enable

In `services/api`:

```env
NORTHCARE_ENV=development
NORTHCARE_REACH_DEMO_ENABLED=true
NORTHCARE_REACH_DEMO_ORGANISATION_ID=org-dev-001
NORTHCARE_REACH_DEMO_FACILITY_ID=fac-dev-001
```

Start the API, then open:

`http://127.0.0.1:8000/reach-simulator`

## Use

1. Choose a numbered menu option.
2. For requests, enter synthetic landmark and phone only.
3. Explicitly agree to consent (option 1) or cancel (option 2).
4. Save the on-screen reference and status PIN privately.
5. Use menu option 5 to check status with those values.

## Notes

- Default gate is **false**. Do not enable in staging/production.
- Restart clears in-browser session memory only; backend records remain.
- Worker Community Requests Centre is R4 — not required for R3 create/status demo.
- Never enter real patient data.

See `docs/development/NORTHCARE_REACH_LOCAL_CONFIGURATION.md` and `docs/testing/REACH_R3_MANUAL_WALKTHROUGH.md`.
