# NorthCare Firebase demo sync

Lightweight **Cloud Functions + Firestore** sync API for hackathon demos. Matches the mobile app REST contract (`/v1/development/auth/token`, `/v1/devices/register`, `/v1/sync/push`, `/v1/sync/changes`).

Mobile still writes locally to SQLite first; sync pushes queued operations to Firestore via this API.

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project: **northcare-ai** (already in `.firebaserc`)
- Billing may be required on Firebase for Cloud Functions (Blaze plan). Firestore free tier is usually enough for demo traffic.

## One-time setup

```powershell
cd services/firebase
firebase login
firebase use northcare-ai
cd functions
npm install
npm run build
```

### Optional: set demo secrets (recommended before public demo)

```powershell
cd services/firebase
firebase functions:config:set demo.sync_password="NorthCareDemo1!" demo.auth_secret="your-long-random-secret"
```

Or set params when deploying (Functions v2 params with defaults are used if unset):

- `DEMO_SYNC_PASSWORD` — shared password for both demo accounts (default: `NorthCareDemo1!`)
- `DEV_AUTH_SECRET` — JWT signing secret (change before any public deployment)

## Run integration tests locally

```powershell
cd services/firebase/functions
npm test
```

The suite covers worker push → Firestore → admin read, role boundaries, idempotency, and auth.

## Admin synced records (demo)

Administrators can read worker-pushed records via:

- `GET /v1/admin/home` — includes `syncedRecordCount`
- `GET /v1/admin/synced-records` — read-only list for the organisation

Mobile: Administration home → **View synced facility records**.

## Deploy

```powershell
cd services/firebase
firebase deploy --only functions,firestore:rules
```

After deploy, note the function URL (example):

`https://us-central1-northcare-ai.cloudfunctions.net/api`

Test health:

```powershell
curl https://us-central1-northcare-ai.cloudfunctions.net/api/health
```

## Demo accounts

| Role | Email | Password (default) |
|------|-------|-------------------|
| Worker (dual-role bypass) | hamdansalifupolibu@gmail.com | `NorthCareDemo1!` |
| Admin | hammydanny1@gmail.com | `NorthCareDemo1!` |

These are **development sync credentials** for the Functions API — not Firebase Auth console users unless you create them separately.

## Firestore layout (created on first sync)

```
organisations/{orgId}
organisations/{orgId}/facilities/{facilityId}
organisations/{orgId}/facilities/{facilityId}/entities/{entityType}/{entityId}
devices/{deviceId}
sync_operations/{operationId}
```

Security rules deny all client access; only Cloud Functions Admin SDK writes data.

## Mobile app configuration

In `apps/mobile/.env`:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_DEV_AUTH_BYPASS=true
EXPO_PUBLIC_API_BASE_URL=https://us-central1-northcare-ai.cloudfunctions.net/api
EXPO_PUBLIC_DEV_SYNC_DEMO_PASSWORD=NorthCareDemo1!
```

Restart Metro after changing env vars.

## Demo script

1. Deploy Functions (above).
2. Start mobile with bypass + API URL configured.
3. Register a client or nutrition assessment offline.
4. Open **Sync Centre** → **Sync now**.
5. In Firebase Console → Firestore, browse:
   `organisations/org-dev-001/facilities/fac-dev-001/entities/...`

## Local emulator (optional)

```powershell
cd services/firebase/functions
npm run serve
```

Emulator API base URL is shown in the terminal (typically `http://127.0.0.1:5001/northcare-ai/us-central1/api`).

## Automated tests

From `services/firebase/functions`:

```powershell
npm test
```

The integration suite covers worker push, admin read, role enforcement, idempotency, and auth failures using an in-memory Firestore mock.

## Path B vs Path A

This is **Path B** (Functions → Firestore only). No Postgres or Render required for the demo sync path. The existing `services/api` FastAPI stack remains available for full production sync later.
