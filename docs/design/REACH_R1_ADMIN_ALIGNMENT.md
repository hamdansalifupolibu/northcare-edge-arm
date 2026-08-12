# Reach R1 — Administration UI Alignment

**Stage:** Reach R1  
**Last updated:** 2026-08-03  
**Workspace:** Administration (not Worker clinical UI)

## Intent

Align administrator worker registration and account management with the frozen Reach profession model, without inventing new system roles or converting Stitch HTML into a website.

## Registration flow

| Step | Purpose |
|---|---|
| Identity | Existing name / email / credential capture |
| Profession | Controlled profession + community/emergency enablement |
| Facility | Existing facility assignment |
| Review | Confirm identity, profession, flags, facility |
| Success | Existing confirmation |

Prefer **one** Profession / Reach-settings step (not multiple micro-screens).

## Account details

- Show professional profile when present (profession label, optional other description, enablement flags).  
- Legacy / null profile → clear “not configured” state with admin path to add.  
- Add/edit uses the same validation rules as registration.

## Visual / UX constraints

- Use existing admin design tokens and components; no hardcoded brand colours.  
- Preserve 48dp touch targets and Android safe areas.  
- No admin-role or dual-role controls on ordinary registration.  
- Offline: block mutations with “Administration requires a secure connection” (not clinical sync queue).  
- Stitch HTML remains visual reference only.

## Routes (implemented)

- `app/(admin)/accounts/register/profession.tsx` — profession step  
- `app/(admin)/accounts/[accountId]/professional-profile.tsx` — add/edit profile  

Feature screens live under `apps/mobile/src/features/administration/`.

## Out of scope for R1 design

Community Requests Centre, USSD simulator chrome, emergency worker acknowledgement UI (later Reach stages).
