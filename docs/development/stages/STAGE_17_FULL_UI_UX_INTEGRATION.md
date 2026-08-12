# STAGE 17 — Full UI/UX Integration, Stitch Fidelity and Motion

**Status:** Implemented — awaiting checkpoint approval  
**Prerequisites:** Stage 16 complete and Stage 17 approved  
**Next stage:** Stage 18 — Accessibility, Security and Quality Hardening (**do not start**)

## Purpose

Visual and interaction polish across the working NorthCare AI app while preserving Stages 1–16 behaviour, safety rules, and truthful offline/sync wording.

## Included

- Full Stitch screen audit and implementation mapping
- Design-system consistency (tokens, typography, spacing, state views)
- AUTH-UX-01 password show/hide on ordinary password fields
- WORKSPACE-UX-01 workspace selection / switch polish
- NOTIF-UX-01 monochrome Android notification icon
- Restrained motion tokens + reduce-motion support
- Worker and Administration surface visual polish (no business-rule changes)
- Inventory and documentation reconciliation

## Excluded

- New clinical logic, risk/nutrition/referral rule changes
- Sync behaviour changes or backend redesign
- New roles, Firebase/push/AI models/ASR
- Real clinical packs or fabricated Dagbanli
- Public registration, patient UI, admin clinical access
- Database redesign, unrelated package upgrades, cloud deploy
- Stage 18 accessibility/security hardening (document only)

## Key paths

| Area | Path |
|---|---|
| Design system | `apps/mobile/src/design-system/` |
| Motion tokens | `apps/mobile/src/theme/motion.ts` |
| Password field | `apps/mobile/src/design-system/forms/PasswordField.tsx` |
| Notification icon | `apps/mobile/assets/notifications/northcare-notification-icon-monochrome.png` |
| Stitch map | `docs/design/STAGE_17_STITCH_SCREEN_MAP.md` |
| Motion policy | `docs/design/STAGE_17_MOTION_POLICY.md` |

## Packages

Prefer **zero** new packages. Stage 17 uses React Native `Animated` only (no Lottie, no Reanimated install, no Tailwind).

## Exit

Checkpoint approved → ready for Stage 18 approval (do not auto-start Stage 18).
