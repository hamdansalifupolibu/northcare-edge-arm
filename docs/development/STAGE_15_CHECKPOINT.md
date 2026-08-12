# Stage 15 checkpoint — Notifications and Follow-up Reminders

**Stage:** 15 — Notifications and Follow-up Reminders  
**Status:** COMPLETE — READY FOR STAGE 16 APPROVAL  
**Date:** 2026-08-02  
**Git commit:** Not created (awaiting approval)

## Environment preflight

| Check | Result |
|---|---|
| Metro / 8081 | Stopped before `expo-notifications` install |
| Package manager | npm (`apps/mobile/package-lock.json`) |
| Mobile baseline (pre Stage 15) | 75 suites / 296 tests; Doctor 20/20 |
| PostgreSQL | Portable PostgreSQL on `127.0.0.1:5432` (running) |
| Alembic head | `0002` |

## Development-worker access

| Field | Result |
|---|---|
| Development-worker email | `hamdansalifupolibu@gmail.com` |
| Development-worker role | `worker` (server-resolved) |
| Development-worker facility | Synthetic `fac-dev-001` (Demo CHPS Compound) |
| Development provisioning method | `python -m northcare_api.cli.provision_development_worker --email …` with dual `getpass`, policy check, Argon2id store, `--update` for re-provision; refuses non-development |
| Password-storage result | Argon2id verifier only (`hash_algorithm=argon2id-v1`); never plaintext / never plain SHA-256 |
| Live provision of owner email | **Operator step** — agent did not receive or enter the password; CLI + tests prove the mechanism |
| Development login result | Email API login supported on mobile in development; synthetic offline IDs retained |
| Production development-auth gate | Disabled outside development/test (`404`) |
| Public-registration status | Absent |
| Password-visibility backlog | AUTH-UX-01 in `docs/design/POST_STAGE_UI_UX_BACKLOG.md` |
| Administrator-provisioning backlog | ADMIN-ACC-01 → Stage 16 |

## Notifications

| Field | Result |
|---|---|
| Notification package | `expo-notifications` |
| Resolved package version | `~57.0.8` / installed `57.0.8` |
| Notification provider architecture | `LocalNotificationScheduler` (Expo) + `Fake` + `Unavailable`; `RemoteNotificationProvider` fail-closed |
| Local-notification status | Implemented |
| Remote-notification status | Unavailable / fail-closed |
| Push-token status | Not requested |
| Exact-alarm status | Not requested; no `SCHEDULE_EXACT_ALARM` |
| Android channel | `northcare-follow-up-reminders`, DEFAULT importance |
| Permission flow | After create rationale only (not launch/onboarding) |
| Permission-denied result | In-app reminder kept; sync still enqueued |

## Reminders

| Field | Result |
|---|---|
| Reminder architecture | `features/reminders` domain/application/scheduling/screens |
| Reminder schema version | Mobile SQLite **v9** (migration `009`) |
| Reminder repository | `FollowUpReminderRepository` + preferences/schedule events |
| Reminder types | generalFollowUp, visitFollowUp, nutritionFollowUp, referralFollowUp, recordReview |
| Reminder sources | workerCreated, clientProfile, visit, nutritionAssessment, referral (+ reserved) |
| Reminder statuses | draft, active, snoozed, handled, cancelled, expired, needsReview, scheduleFailed |
| Date/time handling | Worker-reviewed; past rejected; UTC + original local fields |
| Time-zone handling | Device zone persisted; policy v1 documented |
| Reminder Centre | `/(worker)/more/reminders` |
| Creation / review / scheduling | Implemented with permission rationale |
| Schedule-failure result | Reminder kept as `scheduleFailed` |
| Snooze / reschedule / cancel / handled | Implemented; handled ≠ care completed |
| Native identifier handling | Device-local table; excluded from sync payload |
| Reconciliation | Service method schedules missing / cancels orphans |
| Notification-content privacy | Generic title/body; payload version+reminderId+action |
| Notification-tap result | Auth + unlock + scope checks; fail closed |
| Client/visit/nutrition/referral integration | Explicit create entry points only |
| Sync entity | `follow_up_reminder` / alias `followUpReminder`; `versionedRecord` |
| Backend reminder validation | Rejects device metadata + invalid types/statuses |
| Reminder conflict result | Stage 14 conflict framework; review-required class |
| Remote-push boundary | Documented; provider unavailable |
| Background-task status | Not enabled; not claimed |

## Packages

| Package | Version | Reason |
|---|---|---|
| `expo-notifications` | 57.0.8 | Local notifications + Android channel only |
| `argon2-cffi` | ≥25.1.0 (API) | Development credential hashing only |

`--legacy-peer-deps` used for Expo install (established peer conflict). Expo/React/RN not upgraded.

## Quality gates

| Gate | Result |
|---|---|
| Mobile typecheck | Pre-existing Nutrition/Voice typed-route errors remain; Stage 15 reminder routes cast with `Href` — no reminder-specific TC errors |
| Mobile lint | Pass (0 errors) |
| Mobile tests | **77 suites / 304 tests pass** (was 75 / 296) |
| Expo Doctor | **20/20 passed** |
| Python ruff | Pass |
| Python mypy | Pass (35 source files) |
| Backend pytest | **84 passed** (was 78) against portable PostgreSQL |
| Contract / OpenAPI | Regenerated `implementation/openapi.json` |
| Android runtime | Exact blocker — see `ANDROID_NOTIFICATION_VALIDATION.md` |
| Physical-device validation | Pending |
| Git status | Dirty working tree; **no commit** |

## Migrations

- Mobile: `009_follow_up_reminders` → schema v9  
- Server: Alembic `0002_development_credentials`

## Known limitations

1. Owner email provisioning requires interactive operator `getpass` (password never available to the agent).  
2. Android notification E2E walkthrough not executed (native rebuild / Expo Go 57 interactive path pending).  
3. Notification response deep-link listener is service-backed; full OS response wiring should be re-validated on device.  
4. Pre-existing Expo Router typed-route errors in Nutrition/Voice remain outside Stage 15 scope.  
5. NOTIF-UX-01 monochrome icon deferred.

## Recommended Stage 16 scope

**STAGE 16 — ADMINISTRATION AND ACCOUNT PROVISIONING** (ADMIN-ACC-01). Do not start until approved. Also later UI/UX: AUTH-UX-01, NOTIF-UX-01, Stitch fidelity, motion.

## Approval required

Await human approval before Stage 16 and before any Git commit.
