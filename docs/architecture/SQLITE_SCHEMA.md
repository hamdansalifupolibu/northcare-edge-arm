# SQLite Schema

**Stage:** 13  
**Current version:** 7  

**Authoritative source:** `apps/mobile/src/data/database/migrations/` (registry through `007_assistant_feedback.ts`)  
**Review export:** `implementation/sqlite-schema.sql`

## Tables created

| Table | Purpose | Sync relevance |
|---|---|---|
| `schema_migrations` | Migration history | Local only |
| `app_metadata` | Key/value app DB metadata | Local only |
| `audit_events` | Sanitised audit trail | Local / future sync TBD |
| `facilities` | Local facility references | Future sync |
| `local_account_references` | Account↔facility refs (no secrets) | Local |
| `clients` | Client records | Future sync |
| `caregivers` | Caregiver records | Future sync |
| `client_relationships` | Client–caregiver links | Future sync |
| `encounters` | Visits/contacts | Future sync |
| `screenings` | Screening headers | Future sync |
| `screening_answers` | Typed answers | Future sync |
| `measurements` | Numeric measurements + units | Future sync |
| `risk_assessments` | Deterministic priority results | Future sync |
| `risk_factors` | Matched factor rows for assessments | Future sync |
| `referrals` | Referral headers | Future sync |
| `referral_events` | Append-oriented referral history | Future sync |
| `referral_passports` | Opaque QR passport token hashes | Future sync |
| `nutrition_assessments` | Nutrition assessment headers | Future sync |
| `nutrition_assessment_answers` | Dedicated nutrition answers | Future sync |
| `nutrition_measurement_links` | Assessment↔measurement links | Future sync |
| `nutrition_reference_results` | Reference engine outputs | Future sync |
| `nutrition_guidance_resolutions` | Guidance resolver outputs | Future sync |
| `attachments` | File metadata (not blobs) | Future sync |
| `sync_queue_items` | Offline sync queue foundation | Local queue |
| `voice_capture_sessions` | Voice session lifecycle | Future sync |
| `voice_transcripts` | Transcript text and source | Future sync |
| `voice_extraction_runs` | Extraction attempts | Future sync |
| `voice_extraction_suggestions` | Typed suggestions with review status | Future sync |
| `assistant_feedback` | Local Ask NorthCare feedback (no raw questions) | Future sync |
| `assistant_content_issues` | Local content-issue reports | Future sync |

## Stage 13 additions (migration 007)

- `assistant_feedback`: article/pack version references, feedback category, optional truncated note, sync metadata
- `assistant_content_issues`: controlled issue categories, optional note, pending sync status
- **Not stored:** unrestricted chat history, raw questions, knowledge-pack article bodies (packs remain bundled TypeScript assets)

## Notes

- FTS5 virtual tables are **not** used.
- Domain IDs are UUID strings.
- Soft-delete and sync columns follow existing conventions where applicable.
