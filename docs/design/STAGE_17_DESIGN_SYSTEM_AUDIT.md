# Stage 17 — Design-system audit

**Updated:** 2026-08-02  

## Scope

Reduce accidental hardcoded brand colours, keep tokens/typography/spacing consistent, and reuse state components with truthful copy.

## Findings

| Area | Finding | Action |
|---|---|---|
| Feature UI hex colours | No `#RRGGBB` literals under `apps/mobile/src/features/` | Keep enforcing tokens |
| Theme palette | Canonical colours remain in `apps/mobile/src/theme/colors.ts` | Unchanged values |
| Forms | Ordinary passwords used `AppTextInput` + `secureTextEntry` in admin | Migrated to `PasswordField` |
| Password UX | Login/change already used PasswordField; toggle was tertiary button | Inline show/hide with a11y labels; reset on blur/unmount |
| Workspace cards | Placeholder “Icon: …” captions | Removed; selected border/background emphasised |
| Account list | Nested AppCard density | PressableCard + status chip |
| Loading copy | Admin list used “Try again” as loading message | Replaced with `administration.loading` |
| Motion | Splash only | Added `EntranceMotion` + `useReducedMotion` + motion distance/scale tokens |
| Offline/sync | `SYNC_COPY` / admin offline strings | Preserved; covered by `stateAccuracyCopy` tests |
| Brand | Canonical interim PNG via `NorthCareLogo` | No forge/distort |

## Components added / elevated

- `PasswordField` → design-system forms (auth re-exports)
- `EntranceMotion` → design-system motion
- `useReducedMotion` → theme hook

## Careful non-changes

- No clinical rule or sync engine edits
- No Expo / React / RN upgrades
- No second icon/form library
- PIN entry remains separate (`PinEntry`)

## Residual (Stage 18)

- Full TalkBack pass
- Material Symbols bundling
- Contrast audit against WCAG targets
- Broader empty/error copy localisation readiness
