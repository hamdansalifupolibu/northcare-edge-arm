# Security Claims Register (Stage 18)

**Updated:** 2026-08-02  
Only claim what tests/docs evidence. Prefer under-claiming.

| Claim | Status | Evidence |
|---|---|---|
| Passwords stored as Argon2id verifiers on server | Claimed (dev/server path) | API credential model + hasher |
| Mobile PIN stored as verifier in SecureStore | Claimed | pinVerifier + secure session tests |
| SQLite encrypted at rest | **Not claimed** | No SQLCipher |
| HTTPS enforced for production API base URL | Claimed (config parse + transport guards) | `parsePublicEnv`, sync/admin transport |
| Development auth disabled in production | Claimed | mobile + API tests |
| Public registration absent | Claimed | API surface review |
| WCAG 2.x conformance | **Not claimed** | Accessibility audit only |
| OWASP ASVS / penetration test pass | **Not claimed** | Threat model + tests only |
| Regulatory / medical-device compliance | **Not claimed** | Out of scope |
| Production readiness | **Not claimed** | Ready for Stage 19 testing only |
| Rate limiting in production | **Not claimed** | Boundary doc only |
| FLAG_SECURE on all sensitive screens | **Not claimed** | Policy only |
| Root/jailbreak detection | **Not claimed** | Not implemented (by design Stage 18) |

## Cryptography notes

- Do not casually change scrypt/Argon2 parameters.
- QR token hashing/crypto remains as Stage 10 implementation; Stage 18 verifies tests still pass.
- Cursor signing secrets must be rotated for any shared environment; defaults are development placeholders.
