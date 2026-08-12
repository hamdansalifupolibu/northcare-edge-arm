# Admin offline provisioning plan — judge narrative & phased implementation

**Created:** 2026-08-08  
**Audience:** Hackathon judges, product team, implementation agents  
**Scope:** Administration workspace (Stage 16) — discussion document, not a build spec  
**Constraints:** No real patient data, synthetic fixtures only, no secrets displayed in UI, no Firebase for hackathon sync demo

---

## Executive summary

NorthCare AI ships **one Android app, two workspaces** — worker and administration — for authorised frontline staff. The administration plane already supports **register worker**, **account roster**, **facility assignment**, **community-request permissions**, and **first-login password change**. Today, admin operations are **online-only** against the FastAPI backend; clinical data remains **offline-first** in SQLite with a sync queue.

For judges, the compelling story is **“provision in the field”**: an administrator at a CHPS compound registers a new worker on-device, the account is saved locally and queued for sync when connectivity returns, and the worker receives a **one-time setup handoff** (not full credentials on screen). This document separates **what we can demo honestly today** from **what we would build next** to match the offline-first architecture used elsewhere in the product.

---

## Judge-wow narrative — offline-first admin

### 1. Provision in the field

An administrator opens the **Administration workspace** at a facility with poor or no network. They walk through **Register worker**: display name, email, temporary password, profession, facility, and optional **Reach community-request permissions**. On submit:

- **Today (honest):** submission requires connectivity; offline shows *“Administration requires a secure connection.”*
- **Target story:** account record written to a local admin outbox + roster cache; mutation queued like clinical sync; server reconciles when online with idempotency keys already present in the API.

This mirrors NorthCare’s core principle: **local writes first, sync when possible** — applied to identity provisioning, not just encounters and reminders.

### 2. Temporary password + first-login online (already in product)

The flow is implemented end-to-end on the server and auth screens:

| Step | Behaviour |
|------|-----------|
| Admin registers worker | Admin enters a **temporary password** (min 12 chars, mixed case + digit). Copy states it is **not stored in the app after registration**. |
| Server | Account status → `pendingFirstLogin`; password hashed server-side (dev: `development_credentials`). |
| Worker first sign-in | Worker login with temp password → **`passwordChangeRequired`** → `/(auth)/password-change` → facility confirmation. |
| Connectivity | Worker login screen shows **first sign-in requires connectivity** — honest boundary for identity verification. |

**Demo honesty:** Admin must share the temp password **verbally or on paper** before submit clears the draft; the app never shows it again after success.

### 3. QR handoff card (proposed — not built)

After successful registration, show a **one-time setup card**:

- QR encodes a **short-lived setup token** or **account reference + facility code** — **not** the temporary password or API secrets.
- Worker scans on their phone → deep link to worker login with email pre-filled.
- Aligns with referral QR patterns already in the app; avoids displaying secrets on screen.

**Hackathon scope:** Optional Phase 2 polish; can demo with **manual email entry** on a second device or **workspace switch** on one device.

### 4. Offline roster

Admin home already loads **worker count**, **pending first-login count**, and **inactive worker count** from the API. Account list supports search and pagination.

**Target story:** Cache last-known roster in SQLite so admin sees **pending first-logins**, **inactive workers**, and **facility assignments** offline with a clear “last updated” banner. Mutations queue until online.

### 5. Community request permissions (already in register flow)

On the **profession** step (and account professional-profile edit):

- **`communityRequestsEnabled`** — worker may handle Reach community requests.
- **`emergencyRequestsEnabled`** — only when community is enabled (`emergencyRequiresCommunity` validation).

Stored in `WorkerProfessionalProfile` on the server. **Not yet enforced** in the mobile community-requests module — provisioning exists; routing rules are a follow-up.

### 6. Demo script (~90 seconds)

**Setup:** Dual-role dev account (admin + worker) or two phones; synthetic worker email e.g. `demo.worker+3@northcare.local`; API reachable (Render wake if needed).

1. **0:00–0:15** — Open app → **Switch workspace** → **Administration**. Show home counts (workers, pending first-login, inactive).
2. **0:15–0:45** — **Register worker** → identity → profession (toggle community requests) → facility → review → submit. Mention temp password shared out-of-band.
3. **0:45–1:00** — Success screen → **View account** → status `Pending first login`.
4. **1:00–1:30** — **Switch workspace** to Worker (or second phone) → sign in with temp password → **Change password** → worker home.

**Fallback if offline:** Show offline banner on admin home; explain queued provisioning is on the roadmap; demo pre-provisioned synthetic account for worker login only.

---

## Phased implementation proposal

### Phase 1 — Fix admin crash + polish Admin Home (immediate)

| Item | Status |
|------|--------|
| Fix i18n `Property 't' doesn't exist` on admin screens | **Done** (this session) |
| Admin home dashboard counts + CTAs (accounts, register worker, activity) | **Works** — minor UX polish optional |
| Workspace switch admin ↔ worker | **Works** after i18n fix |

### Phase 2 — Offline registration UX polish

- Persist `registerWorkerDraftStore` across process restarts (SecureStore or SQLite draft table).
- Success **handoff screen**: setup instructions, optional QR placeholder, “register another”.
- Review-step banner: connectivity required for submit (honest until Phase 3).
- Confirm dialogs for deactivate / revoke device (strings exist; UI missing).

### Phase 3 — Optional sync-centre visibility for admin-provisioned accounts

- Local admin outbox table + replay using existing `idempotencyKey` on `POST /v1/admin/accounts`.
- Roster cache table synced from `GET /v1/admin/accounts` / home summary.
- Admin-only row in **Sync Centre**: “1 worker registration pending upload” (separate from clinical queue).
- Requires explicit stage approval — touches data layer and conflict policy.

### What NOT to promise

- **Live central server provisioning without API** — all identity creation goes through FastAPI + PostgreSQL.
- **Firebase** as sync transport for hackathon — not part of NorthCare architecture.
- **Full offline first-login** — initial worker authentication remains online-by-design.
- **Displaying passwords or tokens on screen** after registration — security violation.
- **Real patient or worker PII** — synthetic fixtures only.

---

## Technical inventory

### Current architecture (honest)

```
Admin UI  →  administrationApiClient  →  GET/POST /v1/admin/*
                ↓ assertOnline()
           FastAPI + PostgreSQL (server_accounts, worker_professional_profiles, …)

Clinical UI  →  SQLite repositories  →  sync queue  →  (Stage 14 future)
```

Administration does **not** use mobile SQLite for accounts today. `AdminActivityScreen` reads **local clinical audit events** only — separate from **server admin history** on account detail.

### Key mobile files

| Area | Path |
|------|------|
| Admin home + account list | `apps/mobile/src/features/administration/screens/AdminHomeScreen.tsx` |
| Register flow + account management | `apps/mobile/src/features/administration/screens/AccountManagementScreens.tsx` |
| Local clinical activity | `apps/mobile/src/features/administration/screens/AdminActivityScreen.tsx` |
| Workspace picker | `apps/mobile/src/features/administration/screens/SessionWorkspaceScreen.tsx` |
| API facade | `apps/mobile/src/features/administration/application/createAdministrationServices.ts` |
| REST client + online gate | `apps/mobile/src/features/administration/transport/administrationApiClient.ts` |
| Registration draft (in-memory) | `apps/mobile/src/features/administration/session/registerWorkerDraftStore.ts` |
| Domain types / validation | `apps/mobile/src/features/administration/domain/` |
| Components | `apps/mobile/src/features/administration/components/` |

### Routes — `app/(admin)/`

| Route | Screen |
|-------|--------|
| `index.tsx` | AdminHomeScreen |
| `activity.tsx` | AdminActivityScreen |
| `accounts/index.tsx` | AccountListScreen |
| `accounts/register/*` | RegisterWorkerFlowScreen (identity → profession → facility → review → success) |
| `accounts/[accountId]/*` | Details, profile, facility, status, reset-access, devices, history |

Related: `app/(entry)/session-workspace.tsx`, `app/(auth)/admin-login.tsx`, `app/(auth)/password-change.tsx`.

### Backend (cross-reference)

| Path | Role |
|------|------|
| `services/api/src/northcare_api/administration/routes.py` | Admin REST endpoints |
| `services/api/src/northcare_api/administration/service.py` | Register worker, profile, status |
| `services/api/src/northcare_api/administration/identity_provisioning.py` | Temp password → identity |
| `services/api/src/northcare_api/domain/models.py` | `ServerAccount`, `WorkerProfessionalProfile`, etc. |

### What works vs rough

**Works:** Full register-worker flow, account search, profile/facility/status/reset/devices/history, workspace switch, route guards, unit tests for registration and route access.

**Rough:** Online-only (no local roster/outbox), in-memory registration draft, no list filters UI (API supports status/facility), no destructive confirm dialogs, community permissions not wired to Reach inbox, two “activity” concepts (local vs server audit).

---

## Top 3 judge talking points

1. **Same app, two workspaces** — One binary serves frontline workers and administrators; dual-role accounts switch without reinstalling. Demonstrates thoughtful deployment for low-resource settings.

2. **Honest security boundary** — Temporary password at provisioning, mandatory change on first login, no secrets on screen after submit; synthetic demo accounts only.

3. **Architecture-aligned path to offline provisioning** — Clinical data is already offline-first; admin provisioning can reuse queue + idempotency patterns rather than bolting on Firebase or a separate admin app.

---

## Approval gate

Do **not** implement Phase 2–3 without stage approval. Phase 1 i18n fixes unblock the admin workspace for demo and discussion.

**Next step for team:** Review [`ADMIN_REGISTRATION_ACTIVATION_PLAN.md`](ADMIN_REGISTRATION_ACTIVATION_PLAN.md) → approve Phase 1 (online admin + QR handoff) for hackathon → Phase 2–3 for offline admin submit + sync.
