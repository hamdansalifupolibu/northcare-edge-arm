# Post-stage UI/UX backlog

Items tracked across Stages 16–18. Stage 17 closes the polish items below; Stage 18 remains for accessibility, security, and quality hardening.

## AUTH-UX-01 — Password visibility control

**Status:** Complete in Stage 17  

Every ordinary password field uses `PasswordField` (login, first-login / password change, confirm, admin temporary password, reset-access). Hidden by default, accessible show/hide labels, visibility resets on screen blur/unmount, no password logging. PIN fields remain separate.

## NOTIF-UX-01 — Monochrome notification icon

**Status:** Complete in Stage 17 (asset + plugin wiring)  

Asset: `apps/mobile/assets/notifications/northcare-notification-icon-monochrome.png`  
Documented in `docs/design/STAGE_17_NOTIFICATION_ICON.md`. Native appearance requires development-build rebuild; Expo Go may keep the Expo default icon.

## ADMIN-UX-01 — Administration visual fidelity

**Status:** Addressed in Stage 17 (PARTIAL vs dense Stitch chrome)  

Administration home, account list, registration, and account details use design-system density polish (PressableCard list items, loading copy, active workspace label). Remaining contrast/TalkBack depth → Stage 18.

## WORKSPACE-UX-01 — Workspace selection motion and fidelity

**Status:** Complete in Stage 17  

Selection emphasis, clear active workspace labelling, EntranceMotion with reduce-motion support, no auto-admin, navigation replace clears history on switch.

## ADMIN-ACC-01 — Administrator worker provisioning (functional)

**Completed in Stage 16.** Visual polish tracked under ADMIN-UX-01 (Stage 17).

## ADMIN-DEV-01 — Development administration preview polish

**Status:** Addressed in Stage 17 via shared admin components / design-system preview PasswordField + motion samples.

## Stage 18 hardening (docs + targeted fixes)

**Status:** Complete for Stage 18 scope — see `docs/development/STAGE_18_CHECKPOINT.md`. Full native TalkBack walkthrough remains partial pending development build.

## Later / Stage 19+ (record only — do not start)

- Material Symbols icon font bundling
- Physical Samsung notification / reboot validation
- Final SVG logo visual approval
- Successful `com.northcareai.app` development build on shorter path
- Full TalkBack + physical-device E2E
