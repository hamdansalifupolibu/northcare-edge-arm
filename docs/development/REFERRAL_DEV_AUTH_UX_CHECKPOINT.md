# Referral UX + Dev Auth Save Fix — Checkpoint

**Status:** Ready for review (awaiting approval before commit)  
**Date:** 2026-08-04  
**Scope:** Bugfix + UX polish for Stage 10 referrals + Ask NorthCare keyboard  
**Stage 19:** Not started (still paused)

## What was implemented

### Root cause (Confirm and save failure)
Dev auth bypass uses opaque `accountId` (`dev-dual-…`) and facility code `fac-dev-001`. Referral writes stored these raw values; SQLite read-back via `assertEntityId` threw → generic save error.

### Fix
- Resolve assigned facility with `ensureAssignedFacility` (find-or-create UUID for `fac-dev-001`) before draft create.
- Normalize actor ids with `actorEntityId` → `null` for non-UUID auth ids on all referral (and passport/audit) writes.
- Export `optionalEntityId`; harden referral/audit mapping and repository writes so opaque ids cannot crash read-back.
- Soften priority copy; multi-step Back; selectable `PressableCard` options; human transport labels.
- Shared `useKeyboardBottomInset` for Android form + chat composer; explicit `android.softwareKeyboardLayoutMode: "resize"`.

## Files created

- `apps/mobile/src/design-system/hooks/useKeyboardBottomInset.ts`
- `docs/development/REFERRAL_DEV_AUTH_UX_CHECKPOINT.md` (this file)

## Files modified

- `apps/mobile/src/data/repositories/sqlite/rowHelpers.ts`
- `apps/mobile/src/data/repositories/sqlite/sqliteReferralRepository.ts`
- `apps/mobile/src/data/repositories/sqlite/sqliteAuditEventRepository.ts`
- `apps/mobile/src/features/referrals/application/createReferralServices.ts`
- `apps/mobile/src/features/referrals/screens/CreateReferralScreen.tsx`
- `apps/mobile/src/features/referrals/i18n/referralStrings.ts`
- `apps/mobile/src/features/referrals/__tests__/referralServices.test.ts`
- `apps/mobile/src/design-system/layout/ScrollableAppScreen.tsx`
- `apps/mobile/src/design-system/layout/AppScreen.tsx`
- `apps/mobile/src/design-system/index.ts`
- `apps/mobile/src/features/assistant/components/ChatInput.tsx`
- `apps/mobile/src/features/assistant/screens/AskNorthCareChatScreen.tsx`
- `apps/mobile/app.config.ts`

## Files deleted

- None

## Commands run

```text
npx jest --testPathPattern="referrals" --no-coverage
# Synced changed files → C:\NorthCare\mobile
```

## Packages installed

- None

## Results

| Check | Result |
|---|---|
| Type-check | Not run (full project); referral Jest suite covers service compile paths |
| Lint | Not run |
| Tests | **Pass** — 9 suites / 33 tests (`referrals`) |
| Android device | Manual verify pending |
| Short-path sync | Synced to `C:\NorthCare\mobile` |

## How to verify on device

1. Reloads Metro from short path if that is the running tree; rebuild only needed for `softwareKeyboardLayoutMode` if a native binary is in use.
2. Sign in with **dev auth bypass**.
3. Clients → person → Prepare referral → complete all steps → **Confirm and save** → should reach success + passport (no red save error).
4. Use **Back** (←) between steps; options should look like selected cards.
5. Transport labels should read as plain language (e.g. “Not sure yet”).
6. On communication notes + Ask NorthCare chat: focus the field — keyboard should not cover typed text.

## Remaining risks

- Existing draft rows already saved with `fac-dev-001` / opaque account ids may still map source facility to `null` until a new draft is created; confirm would then require restarting the flow.
- Android keyboard: inset + `resize` should cover common cases; edge-to-edge OEM quirks may still need a second pass.
- Native rebuild required for `app.config.ts` `softwareKeyboardLayoutMode` on development builds (Expo Go often already uses resize).

## Stop condition

Stop here. Do **not** start Stage 19. Await approval before committing.
