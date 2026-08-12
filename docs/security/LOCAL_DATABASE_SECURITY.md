# Local Database Security

**Stage:** 6  
**Last updated:** 2026-08-02  

## Honest limitations

- Ordinary Expo SQLite stores data in the **application sandbox**.
- Android device encryption may protect storage at the OS level when the device is locked — this is **not** application-level database encryption.
- NorthCare AI authentication and PIN unlock prevent ordinary in-app access.
- **SecureStore** protects small security values (session envelope, PIN verifier) — **not** the clinical database.
- The SQLite database is **not** automatically equivalent to SQLCipher.
- **No encryption claim** should be made to judges unless encryption is implemented and validated.

## What Stage 6 stores in SQLite

- Synthetic / future structured clinical and operational records
- Sync-queue metadata (no credentials)
- Audit events with sanitised metadata

## What Stage 6 must never store in SQLite

- Raw PIN
- PIN verifier
- Biometric handles
- Authentication tokens
- Secrets / API keys

## Future evaluation (pilot)

| Topic | Notes |
|---|---|
| SQLCipher or supported encrypted SQLite | Requires Expo config plugin / development build evaluation |
| Development-build requirements | Expo Go may not cover encrypted builds |
| Key storage | Likely SecureStore or Android Keystore — design TBD |
| Key rotation | Recovery and re-encryption plan required |
| Lost-device policy | Wipe / remote revoke interaction with local DB |
| Database recovery | Backup vs privacy trade-offs |
| Low-resource Android performance | Must be measured on physical devices |

Do not add unverified encryption in Stage 6.
