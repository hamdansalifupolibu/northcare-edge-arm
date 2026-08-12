# NorthCare AI — Error handling checklist (worker UI)

**Audience:** Developers adding or changing worker-facing screens in `apps/mobile`.  
**Related:** `WORKER_HOME_UX_AND_ERRORS_PLAN.md` (Phase C), `apps/mobile/src/error/mapUserFacingError.ts`.

Use this checklist before opening a PR that touches screens, forms, or catch blocks in `app/` or `src/features/`.

---

## 1. Never show raw system errors

- [ ] No `ReferenceError`, `TypeError`, HTTP status codes, SQLite messages, or stack traces in UI.
- [ ] Do **not** render `err.message`, `error.message`, or `error?.message` directly in screens or alerts.
- [ ] Route unknown errors through **`mapUserFacingError(error, fallback)`** or the feature mapper (see table below).
- [ ] ESLint warns on raw `.message` in `app/` and `src/features/` — fix warnings before merge.

### Feature mappers (prefer these in catch blocks)

| Feature | Mapper | Typical fallback |
|---------|--------|------------------|
| Shared / generic | `mapUserFacingError` | Calm one-line recovery copy |
| Nutrition | `mapNutritionServiceError` | Action-specific nutrition string |
| Voice | `mapVoiceServiceError` | Voice action fallback |
| Referrals | `mapReferralServiceError` | Referral save/verify fallback |
| Community requests | `mapCommunityRequestError` → `CommunityRequestErrorState` | Mapped heading + body |
| Ask NorthCare (chat model) | `mapAssistantUserMessage` / `sanitizeAssistantErrorMessage` | Model unavailable fallback |
| Reminders | `mapUserFacingError` + `t.reminders.saveFailed` | Date/time guidance |

---

## 2. Plain language and recovery

- [ ] Message explains **what happened** in worker terms, not developer terms.
- [ ] Offer at least one **recovery action**: Retry, Go back, Open Sync Centre, Edit and try again.
- [ ] Avoid dead ends — user can always navigate away or retry.
- [ ] Destructive actions use a **confirmation** dialog with i18n strings (not hardcoded English).

---

## 3. Privacy and safety

- [ ] Error copy must **not** echo patient names, phone numbers, PINs, tokens, or full QR payloads.
- [ ] Do **not** log health data, credentials, or full QR content — use structured logger with redaction.
- [ ] Generic notification wording stays privacy-safe (see Stage 15 / Phase D in UX plan).

---

## 4. i18n

- [ ] User-visible strings live in `src/i18n/en.ts` or feature `*Strings.ts` — not inline in components.
- [ ] When using `t.something`, **`useTranslation()`** (or feature string hook) is imported and called.
- [ ] Alert titles and button labels use i18n keys (e.g. `voiceStrings.cancel`, not `'Cancel'`).

---

## 5. Forms (non-obvious formats)

- [ ] Fields with specific formats have **`placeholder`** and/or **`helperText`** on `AppTextInput`.
- [ ] Examples: reminder date (`YYYY-MM-DD`), time (`HH:MM`), optional phone, referral clinical notes.
- [ ] Validation errors are field-level or form-level — not thrown repository messages.

---

## 6. Loading and empty states

- [ ] `LoadingState` while fetching — not a blank screen.
- [ ] Failed load shows **`AppStateView`** or feature error state — not a silent failure.
- [ ] Offline-specific copy where connectivity is required (community requests, sync).

---

## 7. Development vs production

- [ ] Diagnostics and raw errors stay behind **`diagnosticsEnabled`** / development routes only.
- [ ] Error boundary shows generic copy in production; detail only in dev builds when enabled.

---

## 8. Tests

- [ ] Mapper unit tests for new `mapXError` helpers (system-like input → fallback).
- [ ] Spot-check: trigger failure in emulator (airplane mode, invalid form, missing record).

---

## Quick copy-paste pattern

```typescript
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { useTranslation } from '../../../i18n/LanguageProvider';

// In component:
const t = useTranslation();

try {
  await services.doThing();
} catch (caught) {
  setError(mapUserFacingError(caught, t.myFeature.actionFailed));
}

// Alert:
Alert.alert(t.myFeature.failedTitle, mapUserFacingError(caught, t.myFeature.failedBody));
```

---

## Manual spot-test (S20 / emulator)

Automated (emulator, adb): from `apps/mobile` run `npm run spot-test:phase-c` (optional `PHASE_C_SKIP_LAUNCH=1` if the app is already on worker home).

**Latest run (2026-08-10, emulator-5554): 5/5 passed**

| Check | Result |
|-------|--------|
| App bootstrap | PASS — worker home |
| Airplane mode → community requests | PASS — offline pill / offline state |
| Referral verify + invalid passport | PASS — mapped invalid message |
| Reminders create screen | PASS — helpers + placeholders visible |
| Ask NorthCare without model | PASS — model unavailable i18n |

Manual checks still worth running on S20 wireless before a device build:

1. **Airplane mode** — community requests list shows offline state, not a stack trace.
2. **Invalid reminder date** — save shows validation / save-failed copy, not SQLite text.
3. **Voice assign failure** — client list alert uses mapped message.
4. **Ask NorthCare without model** — model unavailable screen with i18n copy, no native module names.
5. **Referral passport invalid QR** — verify screen shows plain invalid message.

Record results in the stage checkpoint or PR test plan.
