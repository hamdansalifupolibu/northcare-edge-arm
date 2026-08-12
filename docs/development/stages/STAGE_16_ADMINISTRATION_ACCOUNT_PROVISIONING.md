# STAGE 16 — Administration and Account Provisioning

**Status:** Implemented — awaiting checkpoint approval  
**Prerequisites:** Stage 15 complete  
**Next stage:** Stage 17 — Full UI/UX Integration, Stitch Fidelity and Motion (**do not start**)

## Purpose

Secure administrator workflows for provisioning and managing health-worker accounts, with explicit Worker vs Administration workspace separation for multi-role development accounts.

## Included

- Multi-role `server_account_roles` model (roles: `worker`, `admin`)
- Development dual-role provisioning CLI (getpass / stdin only)
- Protected Administration workspace and routes
- Server-authoritative admin APIs under `/v1/admin/...`
- Worker registration (worker role only via ordinary UI)
- Facility assign/reassign, activate/deactivate, reset-access
- First-login password change boundary
- Device list/revoke and sanitised admin history
- IdentityProvisioningProvider boundary (Development / Firebase stub / Unavailable)
- Route guards and workspace switch

## Excluded

- Public / worker self-registration
- Client/caregiver accounts or patient portals
- Real email/SMS/WhatsApp delivery
- Production Firebase credentials / production admin bootstrap
- Ordinary UI assigning admin or dual roles
- Clinical content authoring, org/facility create/delete
- Admin browsing clinical records
- Worker surveillance / analytics / billing
- Full UI redesign and password show/hide (Stage 17 backlog)
- Cloud deployment

## Key paths

| Area | Path |
|---|---|
| Admin APIs | `services/api/src/northcare_api/administration/` |
| Dual-role CLI | `services/api/src/northcare_api/cli/provision_development_account.py` |
| Mobile feature | `apps/mobile/src/features/administration/` |
| Admin routes | `apps/mobile/app/(admin)/` |
| Session workspace | `apps/mobile/app/(entry)/session-workspace.tsx` |

## Security notes

- Backend authoritative for roles, organisation, facility, status
- Admin mutations require connectivity + fresh remote auth (not clinical sync queue)
- Offline admin writes: “Administration requires a secure connection”
- Never store or print passwords/verifiers in source, fixtures, docs, or API responses
