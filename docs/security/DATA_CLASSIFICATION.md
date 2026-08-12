# Data Classification

**Stage:** 18 (updated from Stage 6 baseline)  
**Last updated:** 2026-08-02  

| Class | Examples | Allowed storage |
|---|---|---|
| **PUBLIC** | Product name, tagline, approved public caregiver content, app version, public facility display names where approved | Source, bundled assets, UI copy |
| **INTERNAL** | App configuration, sync diagnostics, content/schema version numbers, non-sensitive readiness flags, development fixture markers | AsyncStorage / SQLite metadata / logs (minimised) |
| **SENSITIVE** | Worker email, device ID, audit metadata, facility assignment, account status | SecureStore session envelope fields; SQLite account refs; admin API responses (minimised) |
| **HIGHLY SENSITIVE** | Client identity, contact information, screening answers, measurements, referral details, voice audio, transcripts, nutrition assessments, reminder notes | SQLite structured tables; FileSystem for audio (metadata in SQLite). Never in notifications, URLs, or ordinary logs. |
| **SECRET** | Access tokens, PIN verifier, password verifiers, raw QR bearer token, cursor signing secrets, Firebase credentials | SecureStore (mobile tokens/PIN); server-only password verifiers; raw QR token transient only — never ordinary SQLite persistence; never source control |

## Field checklist (Stage 18)

| Field | Class | Notes |
|---|---|---|
| Client identity | Highly sensitive | SQLite |
| Contact information | Highly sensitive | SQLite; not in notifications |
| Screening data / measurements | Highly sensitive | SQLite |
| Referral data | Highly sensitive | SQLite |
| Voice audio / transcript | Highly sensitive | FileSystem + metadata; confirm before save |
| Reminder note | Highly sensitive | SQLite; notification body stays generic |
| Worker email | Sensitive | Admin/account surfaces |
| Access token | Secret | SecureStore |
| PIN verifier | Secret | SecureStore |
| Password verifier | Secret | Server only (Argon2id) |
| Raw QR token | Secret | Transient; hash may be stored |
| QR token hash | Sensitive | SQLite |
| Device ID | Sensitive | Registration/sync |
| Audit metadata | Sensitive | No clinical payloads |
| Development fixture | Internal | Production-gated |

## Storage rules verified in Stage 18

- Secret values never enter ordinary logs (logger redaction + tests)
- Highly sensitive data not placed in notifications
- Sensitive data not placed in route parameters / deep-link query clinical payloads
- Raw tokens not put in SQLite unnecessarily
- Password verifiers server-only
- Audio not stored as a database blob
- Development data/auth production-gated
