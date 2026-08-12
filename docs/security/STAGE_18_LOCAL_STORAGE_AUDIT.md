# Stage 18 — Local Storage Audit

**Updated:** 2026-08-02  
**Encryption claim:** SQLite is **not** claimed encrypted (no SQLCipher). See `docs/security/LOCAL_DATABASE_SECURITY.md`.

## Stores

| Store | Allowed content | Findings |
|---|---|---|
| SecureStore | Session envelope, access tokens, PIN verifier, biometric prefs | Suitable small secrets only; production-gated development auth |
| SQLite `northcare.db` | Clinical structured data, sync queue, reminders metadata, QR token **hashes** | No plaintext passwords; no raw QR bearer persistence (transient store) |
| AsyncStorage | Onboarding/workspace preferences | Must not hold clinical records or credentials (covered by privacy tests) |
| FileSystem | Voice audio files + metadata linkage | Audio not stored as SQLite blob |
| OS notifications | Generic title/body + opaque reminder id | No clinical note content |

## Verification evidence

- Auth secure session tests
- Referral security / token crypto tests
- Voice file manager + privacy logging tests
- Reminder notification privacy tests
- Logger redaction tests

## Residual risks

- Unencrypted SQLite on disk if device unlocked/rooted
- OEM backup behaviour — see `MOBILE_BACKUP_AND_RESTORE_POLICY.md`
