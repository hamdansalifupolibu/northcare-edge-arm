# Data Flow and Trust Boundaries (Stage 18)

**Updated:** 2026-08-02  
Diagrams are textual for review — no secrets or real records.

## Legend

- **TB** = trust boundary  
- Arrows show primary data movement; local-first writes do not require network success.

## Worker login

```text
UI credentials → AuthSessionProvider → RemoteAuthProvider (dev|unavailable|future Firebase)
  → access token (SecureStore via accessTokenStore) + account envelope
  → route to unlock / first-login / workspace (TB: UI→services→SecureStore)
```

## Local unlock

```text
PIN/biometric → pinVerifier / LocalAuthentication → unlock session flag
  → protected routes (TB: SecureStore PIN verifier; never logged)
```

## Client creation / screening / priority / referral

```text
Worker UI → feature services → repositories → SQLite (northcare.db)
  → optional sync_outbox dirty rows
Priority: deterministic engine in services (not screens)
Referral passport: token hashed for storage; raw token transient only
```

## QR Passport scanning

```text
Camera frame → qrPassportParser (reject malformed) → review UI
  → no automatic clinical mutation (TB: untrusted camera input)
```

## Voice recording

```text
Microphone → FileSystem audio file + SQLite metadata
  → extraction suggestions require explicit worker confirmation
  (TB: filesystem; audio not SQLite blob)
```

## Nutrition / Ask NorthCare / reminders

```text
UI → feature services → SQLite / curated content packs
Reminders → local notification scheduler (generic payload)
  → tap → auth + unlock required (TB: OS notification surface)
```

## Sync push / pull / conflicts

```text
SQLite dirty → sync engine → HTTPS API (production) → PostgreSQL
Pull cursors signed; conflicts create review records; dirty not discarded
(TB: mobile client→API→DB; org/facility from token not body)
```

## Administrator provisioning / device revocation

```text
Admin UI → administrationApiClient → /v1/admin/* (admin role required)
  → PostgreSQL account/device/audit tables
  → no clinical browse APIs for admin-only accounts
```

## Trust-boundary checklist

| Boundary | Control summary |
|---|---|
| UI → services | Business rules outside screens |
| Services → repositories | No SQL from UI |
| SecureStore | Session, tokens, PIN verifier |
| SQLite | Clinical + sync metadata; no plaintext passwords |
| Filesystem | Audio/attachments metadata-linked |
| API | Token authz; development auth env-gated |
| Notifications | Generic copy; auth on open |
| Deep links | Fail closed to entry/auth |
