# Dagbanli integration — NorthCare AI mobile

**Updated:** 2026-08-08  
**Status:** Phase 1 complete · Phase 2 review prep complete · Phase 3 cloud ASR **disabled** · Phase B (offline WAXAL) planned

---

## Overview

NorthCare AI supports **English** (default) and **Dagbanli** UI through a central i18n layer. Clinical content (screening questions, nutrition guidance body text, Ask NorthCare articles) remains in approved English packs until separately reviewed.

---

## Phase 1 — UI language switch ✅

### What was implemented

- `LanguageProvider` + `useTranslation()` at app root
- `LanguageToggleCompact` on worker home, nutrition landing, and key flows
- Central string maps: `src/i18n/en.ts`, `src/i18n/dg.ts`
- Feature hooks:
  - `useNutritionStrings()`
  - `useVoiceStrings()`
  - `useAssistantStrings()`
  - `useReferralStrings()`
- **65+ screens** migrated from static `en` imports to `useTranslation()`
- Worker flows: clients, visits, referrals, sync, reminders, community requests, auth, onboarding

### How to test

1. Open worker home → tap **Dagbanli**
2. Navigate through Clients, Referrals, Voice-to-Care, Nutrition, Ask NorthCare
3. Button labels and screen titles should switch language
4. Tap **English** to switch back

---

## Phase 2 — Professional review prep ✅

### What was implemented

- All Dagbanli strings marked `NOT_REVIEWED` in `dg.ts` and feature `dg*.ts` files
- `TranslationReviewBanner` shown when Dagbanli is active (worker home)
- `DagbanliTranslationDisclaimerModal` before first switch to Dagbanli (optional “Do not show again”)
- `LanguageDisclaimerProvider` + `useRequestLanguage()` for all language switches
- `DG_TRANSLATION_STATUS` export for review tracking

### Review checklist (for fluent Dagbanli reviewer)

| Area | File(s) | Priority |
|------|---------|----------|
| Worker home & navigation | `en.ts` / `dg.ts` `workerShell` | High |
| Client registration | `dg.ts` `clients.registration` | High |
| Nutrition UI | `dgNutritionStrings.ts` | High |
| Voice-to-Care UI | `dgVoiceStrings.ts` | High |
| Referrals UI | `dgReferralStrings.ts` | Medium |
| Ask NorthCare UI | `dgAssistantStrings.ts` | Medium |
| Auth & onboarding | `dg.ts` `auth`, `onboarding` | Medium |

**Do not use Dagbanli UI text for clinical decisions until review is complete.**

After review, update `DG_TRANSLATION_STATUS` in `src/i18n/dg.ts`:

```typescript
export const DG_TRANSLATION_STATUS = {
  reviewedBy: 'Reviewer Name',
  reviewedAt: '2026-XX-XX',
  status: 'REVIEWED' as const,
  notes: '...',
};
```

---

## Phase 3 — Dagbanli speech ❌ cloud disabled · Phase B planned

### Decision (2026-08-08): offline-first

NorthCare AI is an **offline-first** field app. **GhanaNLP cloud ASR is not used at runtime.**

| App language | Voice transcription | Offline? |
|--------------|---------------------|----------|
| English | Whisper `base.en` on device | Yes |
| Dagbanli | **Manual transcript** (until WAXAL model shipped) | Yes |
| Dagbanli (future Phase B) | On-device `whisper-tiny-waxal-dag` (~77 MB) | Yes (planned) |

### Current behaviour

- `selectTranscriptionProvider()` returns **unavailable** for Dagbanli — no network call
- Voice-to-Care in Dagbanli skips auto-transcription and shows manual entry
- Worker can still record audio and type the transcript offline
- Qwen extraction still runs on confirmed transcript text (English-oriented; Dagbanli text is worker-entered)

### Phase B — offline Dagbanli ASR (next engineering phase)

Target model: [whisper-tiny-waxal-dag](https://huggingface.co/waxal-benchmarking/whisper-tiny-waxal-dag) (University of Ghana / WAXAL, Apache-2.0).

| Property | Value |
|----------|-------|
| Size | ~39M params (~77 MB GGML once converted) |
| WER | ~39.5% on conversational Dagbani (not clinical-grade) |
| Runtime | Same `whisper.rn` stack as English, second model manifest |
| Safety | Worker must review/edit every transcript before save |

Engineering steps: convert PyTorch → GGML, dual-model `WhisperModelManager`, provision via same adb/dev flow as `base.en`.

### GhanaNLP — dev pipeline only (not runtime)

GhanaNLP **Translation API** may be used on a developer machine to draft UI strings → `dg.ts` → human review. Never call from the worker app in the field.

`GhanaNlpTranscriptionProvider.ts` remains in the repo as reference only; it is **not wired** in `selectTranscriptionProvider`.

### Previous Phase 3 scaffold (retired)

~~GhanaNLP online ASR when API key configured~~ — removed from runtime routing 2026-08-08.

---

## Related files

| Path | Purpose |
|------|---------|
| `src/i18n/LanguageProvider.tsx` | Language context + persistence |
| `src/i18n/en.ts` / `dg.ts` | Central UI strings |
| `src/i18n/TranslationReviewBanner.tsx` | Phase 2 review notice |
| `src/i18n/transcriptionLanguage.ts` | Language → ASR code mapping |
| `src/config/ghanaNlpConfig.ts` | GhanaNLP API config |
| `src/features/voice/providers/transcription/GhanaNlpTranscriptionProvider.ts` | Online Dagbanli ASR |

---

## Safety notes

- Do not fabricate Dagbanli clinical translations
- Do not use generative AI for medical content in Dagbanli
- GhanaNLP ASR output requires worker confirmation (same as Whisper)
- API keys must stay in `.env` — never commit or log
