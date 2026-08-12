# STAGE 10 — Referrals and QR Referral Passport

**Status:** COMPLETE (implementation)  
**Date:** 2026-08-02  
**App:** `apps/mobile/` (Expo SDK 57)

## Purpose

Offline-first referral vertical slice with a privacy-safe QR Referral Passport.

## Included

- Draft → confirm referral workflow (destination, reason, communication, review, success)
- Status transitions with append-only events
- Opaque QR passport (token hash in SQLite; raw token only at issue time)
- Local scan / manual code entry / deep-link parse (auth-gated)
- Content-gated synthetic referral reasons (development only)
- Worker-initiated and priority-assessment origins

## Explicitly excluded

Cloud sync, FastAPI, Firebase, push/SMS, ambulance/transport services, facility-directory networking, diagnosis, treatment/medication, AI-generated reasons, voice, nutrition, admin management, Stage 11.

## Content gate

Production loads only `APPROVED_FOR_PILOT` reasons. **Count: 0.** Synthetic development reasons exist for non-production only.

## Exit

See `docs/development/STAGE_10_CHECKPOINT.md`.
