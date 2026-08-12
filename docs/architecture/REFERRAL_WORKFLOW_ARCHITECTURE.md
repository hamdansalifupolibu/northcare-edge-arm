# Referral Workflow Architecture

**Stage:** 10  
**Feature root:** `apps/mobile/src/features/referrals/`

## Layers

| Layer | Responsibility |
|---|---|
| `content/` | Reason registry + content status gating |
| `domain/` | Transitions, priority policy, reference codes, errors |
| `security/` | Token generation/hash, QR parse, transient deep-link store |
| `application/` | Use cases (`createReferralServices`) |
| `components/` + `screens/` | UI only — no SQL / sync-queue access |
| `data/repositories` | SQLite referrals + referral_passports |

## Status model

Persisted statuses (Stage 6 enum): `draft`, `created`, `caregiverInformed`, `journeyStarted`, `facilityReached`, `patientReceived`, `completed`, `cancelled`, `overdue`.

UI may say “client received” for `patientReceived`.

Events are append-only; current status updates in the same transaction as the status event.

## Source facility / worker

Taken from authenticated session only — never from free-form form fields.
