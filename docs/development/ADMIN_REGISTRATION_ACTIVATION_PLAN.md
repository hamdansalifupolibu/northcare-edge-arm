# Admin registration & one-time activation QR — offline-first plan

**Status:** Phase A–B implemented (offline register + QR + worker activation). Phase C sync deferred (future / hackathon narrative only).
**Created:** 2026-08-08  
**Focus:** **Fully offline** worker provisioning (admin phone → worker phone). No online gate on registration or activation UX.  
**Principle:** Same as clinical data — **local SQLite first, sync when connectivity returns**. Server is background reconciliation, never a blocker for the handoff.  
**Supersedes:** Current online-only admin submit + temp-password flow (to be removed, not kept as fallback)  
**Related:** [`ADMIN_OFFLINE_PROVISIONING_PLAN.md`](ADMIN_OFFLINE_PROVISIONING_PLAN.md), [`IDENTITY_PROVISIONING.md`](../architecture/IDENTITY_PROVISIONING.md), [`OFFLINE_VERIFIABLE_REFERRAL_PASSPORT_PLAN.md`](OFFLINE_VERIFIABLE_REFERRAL_PASSPORT_PLAN.md)

---

## 0. Non-negotiable: everything offline (for this feature)

**What “online admin” meant (rejected):** A shortcut where the admin phone must hit the server *before* showing the QR. That is **not** this plan.

**What you asked for — and what we build:**

| Step | Network required? |
|------|-------------------|
| Admin fills registration form | ❌ No |
| Admin submits registration | ❌ No — write SQLite outbox |
| QR shown to worker | ❌ No — signed locally on admin device |
| Worker scans QR | ❌ No |
| Worker confirms details | ❌ No — data is inside QR |
| Worker sets password + PIN | ❌ No — local SecureStore / SQLite |
| Worker does clinical work | ❌ No — already offline-first |
| Background sync to facility server | ✅ Yes — **async only**, like referrals and visits |

The **only** online piece is **background sync** (upload outbox when a connection exists). The user never waits on the network to register or activate.

**Legacy note:** The app *today* calls `assertOnline()` on admin submit and uses temp passwords. That code is **current state**, not the target. Implementation **removes** those gates.

## 1. Why this exists

NorthCare clinical workflows are **offline-first** (SQLite on device, sync queued). Administration today is **online-only** — admin submit calls FastAPI and blocks when offline.

Judges and field reality both need:

> Admin at a CHPS compound registers a new worker **without connectivity**, hands them a **one-time activation QR**, worker scans on their own phone **offline**, confirms details, sets their own credentials — account activates when either device reaches the network.

The QR is **not** a login method. It is a **one-time activation pass**:

| Credential | Proves |
|------------|--------|
| **Activation QR** (signed, short-lived) | An authorised administrator at this facility enrolled this worker |
| **Password** (worker-chosen at activation) | Remote identity for API auth |
| **PIN / biometric** (existing unlock flow) | The enrolled user is using this phone day-to-day |

After activation, the QR is **never used again** for normal login.

---

## 2. The two-phone offline question (answered)

**Problem:** Phone A (admin) registers offline. Phone B (worker) has no network. How does Phone B know who was registered?

**Answer:** The QR **is the data transfer**. It does not contain a lookup id alone — it carries a **self-contained signed enrollment snapshot** created on the admin device at registration time.

```text
Phone A (admin, offline)                Phone B (worker, offline)
─────────────────────────               ───────────────────────────
Register worker locally                 Scan QR
  → SQLite admin_outbox row               → Parse URI + verify Ed25519 signature
  → Build SignedActivationClaims            → Check expiry + nonce not consumed
  → Sign with facility provisioning key     → Show confirm-details screen
  → Render QR on success screen             → Worker sets password + PIN locally
                                          → SQLite pending_activation row
                                          → Mark nonce consumed locally

Both phones (when online, async)
────────────────────────────────
Admin outbox replays POST /v1/admin/accounts (idempotency key)
Worker activation replays POST /v1/auth/activate (activation nonce + password hash)
Server reconciles → account status pendingFirstLogin → active
```

Phone B **never needs the server at scan time** — same pattern as the offline-verifiable referral passport (Ed25519 signed claims, verify on device).

---

## 3. Target architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        ADMIN WORKSPACE (Phone A)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Register worker UI → validate draft → write admin_outbox (SQLite)      │
│                     → sign ActivationClaims → show QR handoff screen    │
│                     → cache roster row (pending_sync)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          QR (signed snapshot)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        WORKER ACTIVATION (Phone B)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Scan QR / deep link → verify offline → confirm details (read-only)     │
│                     → set password (SecureStore hash, never in QR)       │
│                     → facility confirm → create-pin → biometric (existing)│
│                     → write worker_activation_outbox (SQLite)           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          when connectivity returns
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SYNC (existing Stage 14 patterns)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Admin queue: replay registerWorker mutation                             │
│  Worker queue: replay activateAccount mutation                           │
│  Conflict: duplicate email → admin notified, worker sees honest error    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Principle:** Local writes first on both phones. Server is reconciliation, not a gate for the handoff UX.

---

## 4. Activation QR payload (v1 schema)

Mirror referral passport conventions (`northcare://…`, Ed25519, canonical JSON, `kid` for key rotation).

### URI form

```text
northcare://worker-activation/v1?<base64url(payload)>.<base64url(signature)>
```

### Signed claims (`SignedActivationClaimsV1`)

| Field | Type | Notes |
|-------|------|-------|
| `v` | `1` | Schema version |
| `kid` | string | Provisioning key id (facility-scoped) |
| `enrollmentId` | UUID | Client-generated idempotency key (matches admin outbox) |
| `displayName` | string | Worker display name |
| `email` | string | Normalised email |
| `professionCode` | string | From profession registry |
| `facilityId` | string | Assigned facility |
| `facilityName` | string | Display only |
| `organisationId` | string | Tenant scope |
| `communityRequestsEnabled` | boolean | Reach permission |
| `emergencyRequestsEnabled` | boolean | Requires community enabled |
| `adminAccountId` | string | Issuing administrator (audit) |
| `adminDisplayName` | string | Shown on confirm screen |
| `issuedAt` | ISO8601 | Creation time |
| `expiresAt` | ISO8601 | Default **30 minutes** after issue |
| `nonce` | string | Single-use; 128-bit random hex |

### Must NOT appear in QR

- Temporary or chosen password  
- API tokens, refresh tokens, PIN  
- Full admin session material  
- Real patient / client data  

### Signature

- Algorithm: **Ed25519** (reuse `@noble/ed25519` / patterns from `signedPassportCrypto.ts`)  
- Signing key: **facility provisioning key** — development keys in app bundle; production keys issued per facility during admin onboarding  
- Verification: worker app embeds facility public keys by `kid`; unknown `kid` → honest “cannot verify offline” state with manual fallback  

### Single-use enforcement

- Admin device stores `nonce` in SQLite with status `issued` → `consumed`  
- Worker device rejects if nonce already in local `consumed_activation_nonces`  
- Server rejects replay on sync (`activationNonceAlreadyUsed`)

---

## 5. Local SQLite additions

New tables (schema migration — requires stage approval):

### `admin_provisioning_outbox`

| Column | Purpose |
|--------|---------|
| `enrollment_id` | Primary key; matches QR `enrollmentId` |
| `payload_json` | Full register-worker input (no password) |
| `activation_nonce` | Links to QR |
| `idempotency_key` | Replay to `POST /v1/admin/accounts` |
| `status` | `pending_upload` \| `uploaded` \| `failed` \| `conflict` |
| `created_at` | |
| `last_attempt_at` | |
| `error_code` | Sanitised |

### `admin_roster_cache`

Denormalised read model for admin home offline counts (workers, pending activation, inactive). Synced from API when online; seeded locally on offline register.

### `worker_activation_pending`

| Column | Purpose |
|--------|---------|
| `enrollment_id` | From QR |
| `claims_json` | Verified claims snapshot |
| `password_verifier_local` | Argon2id hash — uploaded on sync, never in QR |
| `pin_setup_complete` | Boolean gate before sync |
| `status` | `pending_credentials` \| `pending_upload` \| `active` \| `failed` |

### `consumed_activation_nonces`

Prevents rescan replay on worker device.

---

## 6. End-to-end flow (fully offline)

1. Admin opens **Register worker** — no connectivity check on entry.  
2. Completes identity → profession → facility → review.  
3. **Submit** writes locally only: `admin_provisioning_outbox` + signed QR. **Remove `assertOnline()`.**  
4. Success screen: QR + “Show worker this code” + expiry countdown + “Register another”.  
5. Worker opens app → **Activate with QR** (worker login / onboarding entry).  
6. Scan → offline verify Ed25519 → **Confirm your details** (name, facility, profession, enrolling admin).  
7. Worker creates **password** → `facility-confirmation` → `create-pin` → `biometric-setup` (existing chain).  
8. Worker home — fully usable offline; optional badge **“Sync pending”** for account upload (non-blocking).  
9. **Later**, when either phone has network: outboxes drain in background → server marks account `active`.

### One-phone demo (still fully offline)

Same device, airplane mode: admin registers → QR → switch workspace → scan or deep link → activate. No second phone, no network.

### Removed — not in scope

- ~~Admin must call API before QR~~  
- ~~Temp password on admin screen~~  
- ~~Worker first login with temp password online~~  

## 7. Screen & route plan

| Route | Screen | Phase |
|-------|--------|-------|
| `(admin)/accounts/register/success` | **Activation handoff** — QR hero, expiry, instructions | 2a |
| `(auth)/activate-scan` | Camera / paste QR entry | 2a |
| `(auth)/activate-confirm` | Read-only enrollment summary | 2b |
| `(auth)/activate-password` | Worker chooses password (replaces temp-password login for new enrollments) | 2b |
| Existing `(auth)/facility-confirmation` → `create-pin` → `biometric-setup` | Unchanged chain | — |
| `(worker)/sync-centre` | Row: “Worker activation pending upload” | 3 |
| `(admin)/sync-centre` or admin home banner | Row: “1 registration pending upload” | 3 |

Reuse `ReferralQrCode` component; new parser `activationQrParser.ts` parallel to `qrPassportParser.ts`.

---

## 8. API changes (minimal)

### New / extended endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/v1/admin/accounts` | **Existing** — accept client `enrollmentId` as idempotency key (already partially supported) |
| `POST` | `/v1/auth/activate` | **New** — `{ enrollmentId, nonce, passwordChangePayload }` → consumes nonce, sets verifier, `pendingFirstLogin` → `active` |
| `GET` | `/v1/admin/provisioning-keys/{facilityId}` | **Future** — fetch public keys for offline verify (or bundle in app for hackathon) |

### Identity provider

Extend `IdentityProvisioningProvider`:

- `createWorkerIdentityWithoutPassword` — admin offline path; account exists server-side without verifier until activation  
- `activateWorkerIdentity` — worker-supplied password at first sync  

Development provider: same `development_credentials` table; activation writes verifier on consume.

---

## 9. Implementation order (all offline — build sequence only)

Phases are **build order**, not “online first then offline later”. Every phase keeps the UX offline.

### Phase A — Local admin write + QR (core)

| Task | Effort |
|------|--------|
| SQLite `admin_provisioning_outbox` + migration | M |
| **Remove `assertOnline()`** from register submit | S |
| Facility provisioning Ed25519 keys (dev bundle, like referral passport) | M |
| Sign `SignedActivationClaimsV1` locally; show QR on success screen | M |
| Persist `registerWorkerDraftStore` in SecureStore | S |
| Admin home counts from **local roster cache** (not live API) | M |
| Remove temp-password field from admin UI | S |

### Phase B — Worker activation (offline scan path)

| Task | Effort |
|------|--------|
| `(auth)/activate-scan` + `activationQrParser.ts` + offline verify | M |
| `(auth)/activate-confirm` + `(auth)/activate-password` | M |
| SQLite `worker_activation_pending` + `consumed_activation_nonces` | M |
| Wire to existing PIN / biometric chain | S |
| Unit tests: sign/verify, expiry, nonce replay | S |

### Phase C — Background sync (only online layer)

| Task | Effort |
|------|--------|
| Replay admin outbox → `POST /v1/admin/accounts` (idempotency key) | L |
| Replay worker outbox → `POST /v1/auth/activate` | M |
| Sync centre rows (admin + worker) — **informational**, non-blocking | M |
| Conflict UX (duplicate email, expired nonce) | M |
| API: `activateWorkerIdentity`, roster reconciliation | M |

### Phase D — Production hardening (post-hackathon)

- Facility key rotation via API  
- Optional print slip (like referral PDF)  
- Community-request permission enforcement on worker inbox  

---

## 10. Connectivity boundaries (honest)

| Step | Offline? |
|------|----------|
| Admin fills registration form | ✅ |
| Admin submits registration | ✅ |
| QR displayed | ✅ |
| Worker scans QR | ✅ |
| Worker confirms details | ✅ |
| Worker sets password | ✅ |
| Worker sets PIN / biometric | ✅ |
| Worker uses clinical features | ✅ |
| Background upload to facility server | Sync when online — **does not block UX** |
| Admin server roster (central HR view) | Sync when online — **local cache shown offline** |

**Judge line:** *“Register and activate work with zero connectivity — the QR is the handoff, like our offline referral passport. The facility server catches up in the background when signal returns.”*

---

## 11. Security checklist

- [ ] QR expires (default 30 min)  
- [ ] Nonce single-use (local + server)  
- [ ] No secrets in QR payload  
- [ ] Ed25519 verify before showing PII  
- [ ] Worker password never leaves device except as hash to identity API  
- [ ] Admin must be authenticated in admin workspace to issue QR  
- [ ] Audit events: `workerEnrollmentIssued`, `workerActivationCompleted` (sanitised)  
- [ ] Fail closed: bad signature → no confirm screen  

---

## 12. Demo script (~90 s, airplane mode both phones)

1. **0:00–0:20** — Admin phone, airplane mode: Register worker → QR appears.  
2. **0:20–0:40** — Worker phone, airplane mode: Scan → verify → confirm name/facility.  
3. **0:40–0:55** — Worker sets password → PIN → worker home (clinical work available).  
4. **0:55–1:30** — Optional: turn on Wi‑Fi → Sync centre shows background upload → “Synced”.

## 13. What NOT to promise

- Firebase or consumer BaaS for identity sync  
- QR as daily login replacement  
- Instant cross-device roster without sync  
- Offline **password reset** or **admin revoke** (remain online operations)  
- Displaying passwords on screen after registration  
- Real worker PII in demo — synthetic accounts only  

---

## 14. File map (planned)

| Area | Path |
|------|------|
| Claims + canonical JSON | `apps/mobile/src/features/administration/security/signedActivationClaims.ts` |
| Sign / verify crypto | `apps/mobile/src/features/administration/security/signedActivationCrypto.ts` |
| QR parser | `apps/mobile/src/features/administration/security/activationQrParser.ts` |
| QR display | `apps/mobile/src/features/administration/components/ActivationHandoffCard.tsx` |
| Outbox repository | `apps/mobile/src/data/repositories/sqlite/sqliteAdminProvisioningRepositories.ts` |
| Activation screens | `apps/mobile/src/features/auth/screens/Activate*.tsx` |
| Routes | `apps/mobile/app/(auth)/activate-*.tsx` |
| API | `services/api/src/northcare_api/administration/activation.py` (new) |

Reuse: `ReferralQrCode`, sync queue patterns, `SecureStore`, existing auth chain after password step.

---

## 15. Approval gate

Requires stage approval (SQLite migration + admin/worker outboxes + sync). **No partial “online admin” release.**

**Next step:** Approve Phase A → implement local admin outbox + offline QR + remove `assertOnline()`.
