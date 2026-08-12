# Reminder ↔ Referral notification wiring checkpoint

**Scope:** Reminder Centre product-winning slice (F3a + F3b) — worker-confirmed schedule CTAs, suggested defaults, notification shell wiring  
**Status:** COMPLETE — AWAITING APPROVAL  
**Date:** 2026-08-04  
**Git commit:** Not created (do not commit per request)

## What was implemented

### F3a — Referral / registration schedule CTAs (not silent auto-create)

- After referral success: CTA **“Schedule referral follow-up”** → Create Reminder with `clientId` + `referralId` prefilled.
- After client registration success: CTA **“Schedule follow-up reminder”** → Create Reminder with `clientId` (type resolves to `generalFollowUp`).
- Create Reminder from referral prefill: suggested local date = today + **7 calendar days**, time **09:00** device-local — fully editable before save.
- Constant documented: `REFERRAL_FOLLOW_UP_SUGGESTED_CALENDAR_DAYS = 7` in `suggestedReminderDefaults.ts`.
- Dedup: active/snoozed/`scheduleFailed` `referralFollowUp` for the same referral blocks create and surfaces “Open existing reminder”.

### F3b — Notification shell

- `ReminderNotificationBridge` mounted in root layout (alongside referral deep-link bridge).
- Response listener → validated payload → `resolveNotificationTap` → Reminder details when worker authenticated + unlocked.
- Pending open held in memory only (reminderId/action) across lock/login.
- `reconcile(accountId)` once per worker session when ready.
- Foreground `setNotificationHandler` (banner/list, no sound/badge) on native/dev builds.
- Expo Go: no-op listeners; Reminder Centre remains usable with unavailable scheduler.

### Policy / safety

- No silent auto-create from `confirmReferral`.
- Suggested default + worker confirm documented as allowed in `REMINDER_CLINICAL_BOUNDARY.md`.
- Lock-screen strings remain generic NorthCare wording; payload remains `version` + `reminderId` + `action` only.
- No AI. No Stage 19. No invented clinical timing beyond the fixed +7 day constant.

## Files created

- `apps/mobile/src/features/reminders/domain/suggestedReminderDefaults.ts`
- `apps/mobile/src/features/reminders/navigation/pendingReminderOpenStore.ts`
- `apps/mobile/src/features/reminders/navigation/useReminderNotificationShell.ts`
- `apps/mobile/src/features/reminders/components/ReminderNotificationBridge.tsx`
- `apps/mobile/src/features/reminders/__tests__/suggestedReminderDefaults.test.ts`
- `docs/development/REMINDER_REFERRAL_NOTIFICATION_WIRING_CHECKPOINT.md` (this file)

## Files modified

- `apps/mobile/app/_layout.tsx` — mount `ReminderNotificationBridge`
- `apps/mobile/src/features/reminders/application/createReminderServices.ts` — dedup + `findActiveReferralFollowUp`
- `apps/mobile/src/features/reminders/screens/CreateReminderScreen.tsx` — suggested defaults + duplicate warning
- `apps/mobile/src/features/reminders/index.ts` — export suggestion helpers
- `apps/mobile/src/features/reminders/__tests__/reminderWorkflow.test.ts` — dedup coverage
- `apps/mobile/src/features/referrals/screens/ReferralSuccessScreen.tsx` — schedule CTA only (PDF hint from parallel work preserved)
- `apps/mobile/src/features/referrals/i18n/referralStrings.ts` — CTA label
- `apps/mobile/src/features/clients/screens/ClientRegisterScreen.tsx` — schedule CTA on success
- `apps/mobile/src/i18n/en.ts` — reminder suggestion / dedup / registration CTA strings
- `docs/safety/REMINDER_CLINICAL_BOUNDARY.md` — one-line suggested-default allowance
- `docs/architecture/FOLLOW_UP_REMINDER_ARCHITECTURE.md` — CTA + shell wiring notes

## Files intentionally not rewritten

- Parallel agent surfaces (verify-popup / PDF slip implementation files beyond the single schedule CTA insertion on `ReferralSuccessScreen.tsx`)

## Commands run

```text
npm test -- --testPathPattern="reminders" --no-coverage
```

## Packages installed

- None

## Results

| Check | Result |
|---|---|
| Reminder unit tests | **4 suites / 14 tests pass** |
| Type-check (full app) | Not re-run for whole app this slice |
| Lint | Not re-run for whole app this slice |
| Android emulator / physical device | Manual — see verify steps |
| Sync to `C:\NorthCare\mobile` | Performed after checkpoint |

## How to verify on device

### Expo Go (Reminder Centre only)

1. Sign in as worker → More → Reminder Centre.
2. Create referral → Success → **Schedule referral follow-up** → date/time prefilled (+7 @ 09:00) → edit → save without notifications if desired.
3. Reminder appears in Reminder Centre. Native scheduling unavailable in Expo Go (expected).

### Development build (real notifications)

1. Create referral → Success → Schedule follow-up → enable notifications → confirm reminder in Reminder Centre.
2. Confirm a scheduled OS notification exists (generic title/body only).
3. Tap notification → app opens Reminder details for that id (after unlock if locked).
4. Kill/relaunch app while authenticated → reconcile runs (missing schedules restored / orphans cancelled).
5. Attempt second schedule for same referral → warning + open existing (no duplicate).

### Registration path

1. Register client → success → **Schedule follow-up reminder** → Create with `clientId` (general follow-up; empty date/time until worker enters).

## Offline behaviour

- Reminder create remains local SQLite + sync queue enqueue.
- Notification schedule is best-effort local; permission denied / Expo Go still keeps in-app reminder.
- Reconcile fails soft; Reminder Centre remains source of truth.

## Security and privacy review

- Secrets committed? No  
- Real patient data? No  
- Notification payload names/reasons? No  

## Known limitations / risks

1. Real notification schedule + tap requires a **development build** (not Expo Go).
2. `getLastNotificationResponseAsync` may re-surface the last OS response after relaunch; handled-id set is process-local (cleared on cold start) — OS may deliver the same last response once per process; navigate only after auth/unlock and payload validation.
3. Suggested +7 days is a product UX constant, not clinical protocol — workers must edit if inappropriate.
4. Parallel PDF/verify work on referral passport was not merged beyond carefully inserting the success CTA.

## Outstanding tasks

- Human device validation on S20 Ultra / emulator with a dev build.
- Approval before any git commit.

## Approval required

Await human approval. Do not start Stage 19. Do not commit unless requested.
