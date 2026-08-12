# Reach R3 — Manual Walkthrough

**Date:** 2026-08-03  
**Prerequisite:** API running with `NORTHCARE_REACH_DEMO_ENABLED=true`, Alembic head `0005`.  
**URL:** `/reach-simulator`  
**Rule:** Use synthetic data only. Do not record status PINs or contact numbers in this document.

## Flow A — Pregnancy request

1. Open simulator; confirm simulation banners visible.  
2. Select `1` Pregnancy and newborn.  
3. Select `6` Request a CHPS worker.  
4. Enter synthetic landmark (e.g. Tolon Station).  
5. Enter synthetic phone (`+233200000101`).  
6. Select `1` Agree and send.  
7. Confirm reference and one-time PIN shown; no assigned-worker / facility internals.  
8. **Result:** Pass (when exercised against enabled demo API).

## Flow B — Child-health request

1. Restart or return to main menu.  
2. Select `2` Child health.  
3. Open topic `1` Fever.  
4. Confirm “Demonstration information only” / “Approved public health content pending”.  
5. Select `1` Request a CHPS worker; submit synthetic data and consent.  
6. Confirm generic confirmation.  
7. **Result:** Pass.

## Flow C — Nutrition request

1. Select `3` Nutrition.  
2. Confirm no malnutrition classification on topics.  
3. Select `6` Request nutrition support; submit.  
4. Confirm generic confirmation.  
5. **Result:** Pass.

## Flow D — Emergency

1. Select `0` Emergency help.  
2. Confirm call-112 instruction appears immediately.  
3. Select `2` Send location for urgent human review.  
4. Enter synthetic landmark and phone; agree to emergency consent.  
5. Confirm “Emergency coordination simulation”, 112 reminder, “Live emergency-service integration pending”.  
6. Confirm no ambulance-dispatch claim.  
7. **Result:** Pass.

## Flow E — Status check

1. Using a reference/PIN from a prior successful create (kept privately by the operator).  
2. Menu `5` → enter reference → enter PIN.  
3. Confirm only generic `publicStatusLabel`.  
4. Retry with incorrect PIN → generic failure; no category/location/worker leakage.  
5. **Result:** Pass.

## Flow F — Language

1. Select `6` Language.  
2. Choose `1` English → main menu.  
3. Choose a planned language (`2`–`4`) → planned / untranslated message; continue in English.  
4. **Result:** Pass.

## Notes

- Declining consent (`2`) must not submit a request.  
- Restart clears on-screen PIN/reference from session memory only.  
- Worker lifecycle changes require authorised R2 worker APIs or R4 UI — not the public simulator.
