# Stage 16 Checkpoint — Administration and Account Provisioning

**Stage:** 16  
**Status:** COMPLETE — READY FOR STAGE 17 APPROVAL  
**Date:** 2026-08-02  
**Scope approved:** Yes (Stage 15 complete; Stage 16 approved)

## What was implemented

- Multi-role account foundation (`server_account_roles`, account version/status/first-login fields)
- Alembic migration **0003** with safe migration of legacy single-role rows (`administrator` → `admin`)
- Development dual-role provisioning CLI (`provision_development_account`) using getpass/stdin + Argon2id
- Local dual-role development account provisioned via CLI (password not stored in repository)
- Explicit Worker / Administration workspaces with post-login selection and Switch workspace
- Protected admin routes and server-authoritative `/v1/admin/...` APIs
- Worker registration (worker-only via ordinary UI), facility change, activate/deactivate, reset-access
- Device list/revoke, sanitised administration history, idempotent registration saga
- IdentityProvisioningProvider boundary (Development / Firebase stub / Unavailable)
- Mobile administration feature module and `(admin)/accounts/*` routes
- Docs, OpenAPI artifact, inventories, backlog updates for Stage 17 UI items

## Dual-role development account (safe summary)

| Field | Value |
|---|---|
| Email | `hamdansalifupolibu@gmail.com` |
| Account ID | `dev-dual-8d2ce4bbb8e656c8afea` |
| Roles | `worker`, `admin` |
| Worker facility | `fac-dev-001` |
| Organisation | `org-dev-001` |
| Password | Provisioned locally via CLI (not recorded here) |

## Packages installed

- None (mobile and API). Argon2id remains via existing `argon2-cffi`.

## Alembic head

`0003`

## Results

| Check | Result |
|---|---|
| Mobile type-check | Pass |
| Mobile lint | Pass |
| Mobile tests | **314 passed** / 80 suites |
| Expo Doctor | 20/20 passed |
| Backend ruff | Pass |
| Backend tests | **97 passed** |
| PostgreSQL migration tests | Pass (head `0003`) |
| OpenAPI admin paths | Present in `implementation/openapi.json` |
| New packages | None |

## Android validation

Exact blocker / status: full cold-boot dual-role walkthrough on a physical/emulator device was **not completed in this agent session**. Compatible path remains Expo Go **SDK 57** or `npx expo run:android` (not Expo Go 51). Functional gates (typecheck/lint/tests/doctor + API) passed. Manual walkthrough items (sign-in → workspace selection → worker/admin switch → register worker → facility/status/devices/history) remain operator validation on a compatible Android runtime with local API running.

## Offline behaviour

- Administration mutations require connectivity and fresh remote auth.
- Offline admin writes are rejected with “Administration requires a secure connection”.
- Admin mutations are **not** queued through the clinical sync queue.
- Device revocation is not a remote wipe; offline devices may retain local cache until reconnect.

## Accessibility / i18n readiness

- Admin screens use design-system components, accessibility labels, and `en` string keys.
- Longer translated text supported via existing text components; no hardcoded brand colours in new UI.

## Security and privacy review

- Secrets committed? **No**  
- Real patient data? **No** (synthetic only)  
- Passwords/verifiers in API responses? **No**  
- Dual-role password in docs/fixtures/source? **No**  
- Ordinary UI can assign admin/dual roles? **No**  
- Admin workspace clinical browsing? **Blocked by workspace guards**

## Known limitations

- Firebase production identity provisioning remains unavailable (fail-closed).
- Password show/hide deferred to Stage 17 (AUTH-UX-01).
- Administration visual Stitch fidelity deferred to Stage 17 (ADMIN-UX-01 / WORKSPACE-UX-01).
- Android end-to-end walkthrough pending compatible device/runtime.

## Outstanding tasks

- Operator Android walkthrough on Expo Go 57 / dev client
- Stage 17 approval before UI/UX polish work
- Git commit only after human approval

## Unexpected changes

- Legacy mobile security tests updated for workspace-aware route access and session envelope v2.
- Sync authorisation now uses `has_admin_role` (supports `admin` after migration).

## Files created (high level)

### Backend
- `services/api/alembic/versions/0003_multi_role_administration.py`
- `services/api/src/northcare_api/administration/*`
- `services/api/src/northcare_api/cli/provision_development_account.py`
- Admin/security/contract tests under `services/api/tests/`

### Mobile
- `apps/mobile/src/features/administration/**`
- `apps/mobile/app/(admin)/accounts/**`
- `apps/mobile/app/(entry)/session-workspace.tsx`
- `apps/mobile/app/(development)/administration-preview.tsx`

### Docs
- `docs/development/stages/STAGE_16_ADMINISTRATION_ACCOUNT_PROVISIONING.md`
- `docs/development/DUAL_ROLE_ACCOUNT_POLICY.md`
- `docs/development/DEVELOPMENT_DUAL_ROLE_ACCESS.md`
- `docs/security/ADMINISTRATOR_CLINICAL_ACCESS_BOUNDARY.md`
- `docs/security/ADMINISTRATOR_REAUTHENTICATION_POLICY.md`
- Architecture docs: identity provisioning, workspace separation, account status, saga, device revocation
- `docs/development/STAGE_16_CHECKPOINT.md` (this file)

## Recommended next stage

**STAGE 17 — FULL UI/UX INTEGRATION, STITCH FIDELITY AND MOTION**  
Do not start until this checkpoint is approved.

## Git status

No Stage 16 commit created (approval required).

---

**STAGE 16 COMPLETE — READY FOR STAGE 17 APPROVAL**
