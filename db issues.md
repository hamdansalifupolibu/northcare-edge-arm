# Database issues — Voice-to-Care (hackathon notes)

**Last updated:** 2026-08-09  
**Scope:** SQLite read/write failures that broke Voice-to-Care list and save flows on device  
**Product:** NorthCare AI (`apps/mobile`, schema **v12**)

These issues shared one theme: **strict domain mapping after a successful SQLite write** turned valid rows into hard failures for the whole screen.

---

## 1. Recordings list showed only “Try again”

### Symptom
Opening Voice recordings showed an error + **Try again**. Retry repeated the same generic message.

### Root cause
`listRecentByAccount` mapped every row with `mapSession`. One historical / corrupt session (invalid `ui_state` or status enum) threw `RepositoryError: dataIntegrity`. That exception aborted the **entire** list.

### Fix
- Skip unreadable session rows in `listRecentByAccount` instead of failing the query.
- Harden `listRecordings` so transcript / extraction enrichment failures for one session do not drop the whole hub.

### Files
- `apps/mobile/src/data/repositories/sqlite/sqliteVoiceRepositories.ts`
- `apps/mobile/src/features/voice/application/createVoiceServices.ts`

---

## 2. Save failed: `voiceSuggestion.findById failed`

### Symptom
After AI analysis, **Save confirmed information** failed with:

`RepositoryError: voiceSuggestion.findById failed`

### Root cause
Development auth bypass uses an **opaque account id**:

`dev-dual-8d2ce4bbb8e656c8afea`

That string is **not** a UUID v4. On review, SQLite correctly stored it in `reviewed_by_account_id`. On read-back, `assertEntityId(...)` rejected it and `mapSqliteError` wrapped the throw as `voiceSuggestion.findById failed`.

Metadata fields already used `optionalEntityId` (coerce non-UUID actors to `null`). Suggestion `reviewed_by_account_id` did **not**.

### Fix
Use `optionalEntityId(row.reviewed_by_account_id)` in suggestion mapping — same pattern as `created_by` / `updated_by`.

### Files
- `apps/mobile/src/data/repositories/sqlite/sqliteVoiceRepositories.ts`
- Regression: `apps/mobile/src/features/voice/__tests__/opaqueAccountReview.test.ts`

---

## 3. Save still failed after suggestion fix: `encounter.findById failed`

### Symptom
With opaque account review fixed, quick-apply failed when creating / reading a draft visit.

### Root cause
`resolveOpenEncounterForVoice` set `workerAccountId` to the opaque dev account id. Encounter `findById` then called `assertEntityId` on `worker_account_id` (and similarly strict facility ids).

### Fix
Map `workerAccountId` and `facilityId` with `optionalEntityId` in `sqliteEncounterRepository`.

### Files
- `apps/mobile/src/data/repositories/sqlite/sqliteEncounterRepository.ts`

---

## 4. Generic “Something went wrong while saving voice information”

### Symptom
Workers only saw a vague save error; Metro did not show the real domain message.

### Root cause
`DatabaseManager.withTransaction` caught **all** non-`RepositoryError` throws (including `VoiceError`) and replaced them with `RepositoryError('transactionFailed', 'Transaction failed')`.  
`mapVoiceServiceError` then mapped that to the generic save string.

### Fix
Preserve named application errors (e.g. `VoiceError`) thrown inside transactions. Improve mapping for `transactionFailed` when a cause message is present.

### Files
- `apps/mobile/src/data/database/connection/DatabaseManager.ts`
- `apps/mobile/src/features/voice/application/createVoiceServices.ts` (`mapVoiceServiceError`)
- Regression: `apps/mobile/src/features/voice/__tests__/quickApplyErrors.test.ts`

---

## 5. Empty AI extraction looked like a broken session

### Symptom
After confirm / re-transcribe, Results opened with **no fields**, or save appeared to succeed while the recording stayed incomplete.

### Root cause
Qwen could return `status: 'completed'` with `suggestions: []`. The service still marked the session `reviewRequired` and navigated to Results with empty data. A separate “fake save” path navigated away without applying fields.

### Fix
- Throw on empty extraction before creating a run / setting `reviewRequired`.
- Navigate to Results with `runId` loaded from SQLite (not URL `fieldsJson`).
- Remove silent save fallback; require a real extraction run.
- Route empty `reviewRequired` sessions back to transcript from the recordings list.

### Files
- `createVoiceServices.ts` (`requestExtraction`, `quickApplyExtraction`)
- `VoiceTranscriptScreen.tsx`, `VoiceResultsScreen.tsx`
- `voiceRecordingNavigation.ts`

---

## Pattern to keep

| Do | Don’t |
|----|--------|
| Use `optionalEntityId` for **actor / facility** columns that may store opaque auth ids | `assertEntityId` on every account-looking column |
| Skip or isolate corrupt rows in list queries | Fail the whole list on one bad row |
| Preserve domain errors through transactions | Mask `VoiceError` as generic `transactionFailed` |
| Keep worker-facing messages specific | Hide SQLite mapping failures behind one save string |

---

## Related

- Voice-to-Care implementation summary: [`README.md`](README.md) (Voice-to-Care section)
- UI patterns: [`forms and UI design.md`](forms%20and%20UI%20design.md)
