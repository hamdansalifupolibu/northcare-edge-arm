# Offline-Verifiable Referral Passport — Implementation Plan

**Status:** Implemented (signed Ed25519 passport + verify screen)  
**Last updated:** 2026-08-04  
**Scope:** UNICEF-aligned last-mile referral continuity — portable trust without claiming full facility sync  
**Related:** Stage 10 referrals (`docs/architecture/REFERRAL_WORKFLOW_ARCHITECTURE.md`, `docs/architecture/QR_REFERRAL_PASSPORT_SECURITY.md`)

---

## 1. Why this exists

Today’s Stage 10 QR passport is an **opaque local lookup token**. Scan only finds a referral if that exact phone already stored the matching token hash.

That works on one device, but judges expect:

> Worker A creates → caregiver carries QR/PDF → Worker B verifies without sharing a live database.

This plan upgrades the passport so verification can succeed **offline on another account / device** using a **signed minimal payload**, while **facility inbox sync remains future work**.

---

## 2. Demo story (one phone is enough)

1. Log in as **Worker 1** (origin facility, e.g. CHPS / community).
2. Open a client → **Prepare referral**.
3. Choose destination from directory (e.g. Tamale Teaching Hospital).
4. Confirm caregiver informed / transport as today.
5. Save → show **QR passport** + **shareable / printable slip**.
6. Log out.
7. Log in as **Worker 2** (receiving side — demo account).
8. Open **Verify referral passport** → scan QR (or paste payload).
9. App verifies signature offline → **Valid NorthCare referral** + safe summary.
10. Closing line for judges: *“Later, async sync will push referrals into each facility inbox. Today the passport proves the handoff is real offline.”*

No fake “DB match pretending to be sync.” Worker 2 verification must not depend on Worker 1’s SQLite row being present.

---

## 3. What already exists (baseline)

| Capability | Status |
|---|---|
| Create referral offline (from client) | Implemented (Stage 10) |
| Destination facility select (local directory) | Implemented |
| Status timeline (created → … → completed) | Implemented |
| Opaque QR + local hash lookup | Implemented |
| Scan / enter code on **same device DB** | Implemented |
| Referrals **inbox** (open/overdue first + next step) | Implemented (recent UX) |
| Success → passport QR hero path | Implemented (recent UX) |
| Honest “scan does not auto-mark Received” | Implemented |
| Offline-verifiable **signed** QR | **Implemented** (Ed25519 v2) |
| Shareable PDF / printable slip | **Implemented** (expo-print PDF + share/print; text slip retained) |
| Ghana landmark facilities seeded for demos | **Implemented** (Tamale Teaching / Central, Korle Bu, demo CHPS) |
| Cross-facility referral inbox sync | **Future — out of this slice** |

---

## 4. Target architecture (this slice)

```text
Worker 1 (origin)
  create referral → SQLite row (unchanged)
                 → issue passport:
                      A) opaque token (keep for local lookup) OR migrate
                      B) NEW: signed compact payload → QR + slip

Worker 2 (receiver demo)
  scan QR → parse payload → verify signature with app public key
         → show Valid / Invalid
         → optional: "Mark received on this device" (local only; does not update Worker 1 without sync)
```

### QR contents (minimal — privacy first)

**Allowed in signed payload (illustrative):**

- Schema version  
- Referral reference code  
- Origin facility id + display name  
- Destination facility id + display name  
- Reason **category / approved reason code + short label** (not full clinical notes)  
- Priority band only if already recorded (`red` / `amber` / `green` / undetermined)  
- Created-at (UTC)  
- Issuer account id (opaque) or role label  
- Expiry (optional, e.g. 30 days)  
- Signature over canonical bytes  

**Must never appear in QR / slip:**

- Client full name (prefer initials or “Registered client” unless demo seed explicitly allows synthetic display name)  
- Phone number  
- Screening answers / measurements  
- Voice transcripts  
- Free-text worker clinical notes  
- Status PIN / auth tokens  

**Default product stance:** slip shows destination + reason label + reference + “Valid when signature verifies”; show synthetic client label only if already on-device and worker authenticated — never embed PII in the QR body if avoidable.

---

## 5. Destination facilities (Ghana demo directory)

Strengthen the **local facility directory** (not free-text hospital names as the primary path) with recognisable destinations for judges, for example:

- Tamale Teaching Hospital  
- Tamale Central / Municipal related facility entries (as approved naming in seed data)  
- Korle Bu Teaching Hospital (Accra) — optional national recognisable option  
- Existing CHPS / district entries already in app seeds  

Worker 1 selects from this list during referral creation. Keeping controlled directory values makes Worker 2’s verified summary readable and consistent.

---

## 6. Cryptography approach (simple + honest)

| Item | Direction |
|---|---|
| Algorithm | Prefer device-available crypto already in Expo (`expo-crypto`) / audited approach documented in security doc |
| Keys | Development signing keypair for hackathon builds; public verify key embedded; private sign key **not** shipped if avoidable — for MVP demo, document risk of embedded demo key and scope it as **development-only** |
| Encoding | Compact URI or `northcare://referral-passport/v2/{base64url(payload.sig)}` — exact form fixed in implementation |
| Failure | Invalid signature / expired / unsupported version → clear “Not a valid NorthCare passport” (no crash, no auto clinical write) |

Separate from llama.rn / Ask NorthCare. **No AI** in QR verify.

Update / supersede parts of `docs/architecture/QR_REFERRAL_PASSPORT_SECURITY.md` when implemented (v1 opaque vs v2 signed).

---

## 7. UI / UX to add

1. **Worker 1 — Success / Passport**
   - Large QR  
   - “Share slip” / “Export printable summary” (PDF or shareable image — pick simplest reliable Expo path)  
   - Caregiver script: show this at the receiving facility  

2. **Worker 2 — Verify entry**
   - Referrals tab: primary secondary action **Verify passport** (scan / paste)  
   - Result screen: Valid / Invalid + safe fields  
   - Caption: “Offline verification. Facility inbox sync is not active yet.”  

3. **Keep inbox** for origin worker tracking (open / next step) — unchanged story for Worker 1.

---

## 8. Explicitly out of scope (this slice)

- Real async/sync replication of referrals across facilities  
- Pretending local DB lookup is multi-facility sync  
- National health exchange / FHIR bridges  
- Embedding full EMR in QR  
- Auto-creating referrals from Ask NorthCare or Reach  
- Live SMS / WhatsApp clinical transport as system of record  
- Changing Stage 19 / Reach R6 product freeze without approval  

---

## 9. Implementation checklist (when approved to build)

1. Domain: signed passport payload type + canonical serialisation  
2. Security: sign / verify helpers + unit tests (valid, tampered, expired, unknown version)  
3. Facility seed: add/confirm Tamale / Korle Bu demo destinations  
4. Issue path: generate v2 QR alongside or replacing v1 for new referrals  
5. Verify screen + scan/paste route for Worker 2  
6. Shareable slip (PDF or image)  
7. Preserve privacy strings + accessibility labels (never read raw token aloud)  
8. Tests: inbox remains green; passport privacy tests extended  
9. Docs: update referral architecture, QR security, README status, demo script beat  
10. One-phone dual-account demo script in `docs/demo/` or referral runbook  

---

## 10. Judge-facing sentence (use this)

> “A CHPS worker creates a referral offline and gives the caregiver a signed QR passport and slip. Another NorthCare worker can verify that passport offline without sync. Full facility-to-facility referral inbox sync is the next step.”

---

## 11. Approval gate

Approved and implemented. Use checklist in §9 as regression guide for follow-up polish (true PDF export can wait).
