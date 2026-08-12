# Stage 17 — NOTIF-UX-01 monochrome notification icon

**Updated:** 2026-08-02  
**Status:** Implemented (asset + config wiring)

## Decision

Ship a **generic white-on-transparent bell silhouette** as the Android status-bar / notification small icon. This is **not** a forged NorthCare brand mark and does not embed dynamic text.

## Asset

| Field | Value |
|---|---|
| Path | `apps/mobile/assets/notifications/northcare-notification-icon-monochrome.png` |
| Size | 96×96 PNG, RGBA |
| Style | White silhouette, transparent background (Android monochrome expectation) |
| Config | `apps/mobile/app.config.ts` → `expo-notifications` plugin `icon` |

## Runtime note

The icon is applied when the native project is generated / rebuilt (`npx expo run:android` or EAS). Expo Go may continue to show the Expo/default notification affordance until a development build is installed. Reminder **content** remains generic and privacy-safe regardless of icon.

## Fallback (if rebuild unavailable)

Documented fallback: Expo/default notification icon path from Stage 15 remains visually acceptable for demos; product intent is the monochrome asset above once a compatible native build is produced.

## Out of scope

- Full-colour brand logo as status-bar icon (Android guidelines)
- Partner / UNICEF / GHS marks
- Dynamic text inside the icon
