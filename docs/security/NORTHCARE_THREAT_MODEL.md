# NorthCare AI — Threat Model (Stage 18)

**Updated:** 2026-08-02  
**Scope:** Android-first mobile app (`apps/mobile`) + sync/admin API (`services/api`)  
**Claim level:** Engineering threat model for hardening — **not** a formal penetration-test or certification report.

## Actors

| Actor | Intent |
|---|---|
| Authorised health worker | Legitimate offline-first care workflows |
| Authorised administrator | Account provisioning / device revocation (non-clinical) |
| Dual-role development user | Local demo only; production-gated |
| Lost-device finder | Opportunistic access to unlocked or backup data |
| Malicious local device user | Extract SQLite / SecureStore / audio / notifications |
| Compromised worker credential | Abuse clinical APIs and sync within org/facility scope |
| Compromised administrator credential | Abuse provisioning / revocation |
| Unauthorised facility worker | Cross-facility or cross-org access attempts |
| Network attacker | Intercept or replay API traffic |
| Malicious API client | Forge tokens, roles, org/facility claims |
| Malicious QR payload creator | Inject crafted passport payloads |
| Compromised development environment | Leak `.env`, tokens, verifiers |
| Dependency attacker | Supply-chain compromise |
| Insider with database access | Direct PostgreSQL / SQLite inspection |

## Assets

Client/caregiver identity, screening answers, measurements, priority assessments, referrals, QR passport tokens/hashes, voice recordings/transcripts, nutrition data, reminder notes, worker/admin accounts, access tokens, PIN/password verifiers, device registrations, audit events, clinical-content approval metadata.

## Trust boundaries

- Android UI → application services → repositories (no SQL from UI)
- SQLite / SecureStore / filesystem / OS notification scheduler
- Mobile API client → FastAPI → PostgreSQL
- Camera/QR input, microphone/audio files
- Development CLI and development authentication (env-gated)
- Worker vs Administration workspaces

## Selected threats (representative)

| ID | Threat | Asset | Attack path | Existing control | Test evidence | Residual risk | Future control |
|---|---|---|---|---|---|---|---|
| T01 | Lost unlocked device | Clinical SQLite | Physical access | App lock / SecureStore session; no SQLCipher yet | auth/session tests | Disk readable if unlocked/rooted | Evaluate encryption at rest for pilot |
| T02 | Credential stuffing / leaked password | Accounts | API login | Argon2id verifiers; production Firebase path fail-closed without config | `test_development_auth_gate`, production config tests | Dev secrets if misconfigured | Rotate secrets; enforce HTTPS + Firebase |
| T03 | Role escalation via client claims | Admin APIs | Send forged role/org in body | Server binds identity from token; ignores client role | `test_authz_api`, admin security tests | Residual if verifier misconfigured | Continuous authz matrix review |
| T04 | Cross-facility sync pull | Clinical records | Cursor reuse / forged scope | Cursor signing + facility/org checks | sync/security suites | Insider DB access | Stronger tenant isolation |
| T05 | Malicious QR payload | Referral flow | Camera scan | Strict parser; no auto clinical write | `qrPassportParser` / referralSecurity tests | Social engineering after scan | Trusted exchange (future) |
| T06 | Notification leakage | Reminder content | Lock-screen preview | Generic title/body only | reminder privacy tests / NOTIFICATION_PRIVACY | OS OEM differences | Physical-device confirmation |
| T07 | Deep-link into protected data | Routes | `northcare://…` | Fail-closed redirects to auth boundaries | `routeAccess` / Stage 18 deep-link tests | OS link handling quirks | Keep inventory current |
| T08 | Log / clipboard exfiltration | Tokens, clinical text | Debug logs, paste | Logger redaction; clipboard policy documented | logger tests; logging review | Manual paste by worker | Clipboard hardening on sensitive fields |
| T09 | Development auth in production | All | Mis-set `NORTHCARE_ENV` | Provider/factory fail-closed | mobile + API production config tests | Operator misconfiguration | Deployment checklist (Stage 19) |
| T10 | Dependency compromise | Runtime | npm/pip package | Audit + inventories; prefer zero new packages | DEPENDENCY audit | Moderate npm findings deferred | Stage 19 patch review |

## Out of scope claims

No WCAG, OWASP ASVS, ISO, HIPAA, GDPR certification, or medical-device claims are made by this document.
