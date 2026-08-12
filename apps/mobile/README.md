# NorthCare AI — Mobile Application

**Smarter care. Stronger communities.**

Android-first Expo (React Native + TypeScript) application for NorthCare AI.

## Location

Active mobile project:

```text
apps/mobile/
```

The former `northcare-app/` scaffold was migrated here during Stage 2. Do not create a second Expo application.

## Identity (development)

| Field | Value |
|---|---|
| Display name | NorthCare AI |
| Slug | `northcare-ai` |
| Version | `0.1.0` |
| Android package | `com.northcareai.app` (**PROVISIONAL — review before public release**) |
| Scheme | `northcare` |
| Tagline | Smarter care. Stronger communities. |

## Stack

| Item | Version / choice |
|---|---|
| Expo SDK | ~57.0.9 |
| React Native | 0.86.2 |
| React | 19.2.3 |
| TypeScript | ~6.0.3 |
| Package manager | **npm** (`package-lock.json`) |
| Design system | `src/design-system/` (custom RN primitives) |
| Theme tokens | `src/theme/` |
| Fonts | Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`) |
| SVG | `react-native-svg` (typed risk icons + QR via `react-native-qrcode-svg`) |
| Navigation | **Expo Router** ~57.0.9 (locked in Stage 4) |
| Preferences | `@react-native-async-storage/async-storage` (non-sensitive only) |
| Secure session | `expo-secure-store` (session envelope + PIN verifier) |
| Biometrics | `expo-local-authentication` (optional unlock) |
| PIN KDF | `@noble/hashes` scrypt (versioned) |
| Local database | `expo-sqlite` ~57.0.1 (`northcare.db`, schema v9) |
| Camera / QR scan | `expo-camera` ~57.0.3 (`CameraView` barcode) |
| QR render | `react-native-qrcode-svg` |
| Repositories | `src/data/repositories/` (UI must not access SQLite directly) |
| Visits / screening | `src/features/visits/`, `src/features/screening/` (application services + typed template engine) |
| Risk / priority | `src/features/risk/` (deterministic engine v1; synthetic packs development-only) |
| Referrals / passport | `src/features/referrals/` (offline referral + opaque QR passport; local hash resolve only) |
| Ask NorthCare | `src/features/assistant/` (retrieval-only; 0 pilot packs; generative unavailable) |
| Community Requests (Reach R4–R6) | `src/features/community-requests/` (online Worker centre; R2 APIs including escalate; no SQLite request repo; demo packaging in R6) |
| Offline AI Stage 1 | `src/features/offline-ai/` (`llama.rn@0.12.8`, locked Qwen2.5-0.5B Q4_K_M; dev route `/(development)/offline-ai`; not connected to Ask NorthCare) |

## Commands

Run from `apps/mobile/`:

```bash
npm start              # Expo Metro
npm run start:clear    # Expo with cache cleared
npm run android        # Open on Android emulator/device
npm run typecheck      # Strict TypeScript
npm run lint           # ESLint (expo config)
npm test               # Jest (jest-expo)
npm run doctor         # Expo Doctor
```

Or from the repository root:

```bash
npm run mobile:start
npm run mobile:start:clear
npm run mobile:android
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test
npm run mobile:doctor
```

## Environment

Copy `.env.example` values as needed. Public variables only:

- `EXPO_PUBLIC_APP_ENV` — `development` \| `staging` \| `production`
- `EXPO_PUBLIC_API_BASE_URL` — optional absolute URL; unused in Stage 5
- Future Firebase public client vars (`EXPO_PUBLIC_FIREBASE_*`) — not provisioned yet

Never put private secrets in `EXPO_PUBLIC_*` variables.

Remote auth: `DevelopmentAuthProvider` in development/test; `UnavailableAuthProvider` fails closed in staging/production until Firebase is configured.

## Path aliases

Stage 3 uses **relative imports** only.

A future `@/*` → `src/*` alias is deferred until TypeScript 6 path-mapping guidance and Metro resolution are validated together.

## Directory structure

```text
apps/mobile/
  app/                     # Expo Router routes (entry / auth / worker / admin / development)
  app.config.ts
  assets/
    brand/
    app-icon/
    images/onboarding/
    icons/risk/
  src/
    theme/
    design-system/
    data/                  # SQLite, domain, repositories, fixtures
    features/              # splash, onboarding, auth, clients, visits, screening, risk, …
    launch/
    preferences/
    navigation/
    i18n/
    __tests__/
```

Client management (Stage 7), visits/guided screening (Stage 8), deterministic priority engine (Stage 9), referrals + QR passport (Stage 10), voice-to-care (Stage 11), nutrition assessment + guidance (Stage 12), and **Ask NorthCare constrained assistant** (Stage 13) are implemented. Production has zero `APPROVED_FOR_PILOT` content packs across screening, risk, referral, voice, nutrition, and Ask NorthCare — all fail closed. Generative LLM assistance and sync networking are not implemented.

### Nutrition (Stage 12)

Feature root: `src/features/nutrition/` — schema-driven assessment capture (reuses Stage 8 `QuestionField`), reference engine v1, guidance cards, draft/complete/correct workflow. Development synthetic content only; production fails closed (0 pilot templates/reference/guidance packs). See `docs/architecture/NUTRITION_MANAGEMENT_ARCHITECTURE.md`.

### Ask NorthCare (Stage 13)

Feature root: `src/features/assistant/` — retrieval-only answers from bundled TypeScript knowledge packs; TypeScript inverted index (`SEARCH_INDEX_VERSION=1`); generative provider interface unavailable; on-device model deferred; conversation in-memory (cleared on lock/logout); SQLite migration 007 for feedback/issues metadata only. Production: 0 pilot packs (fail closed). Development: 1 synthetic pack `synthetic-dev-ask-northcare-v1`. See `docs/architecture/ASK_NORTHCARE_ARCHITECTURE.md`.

## Entry / auth / clients / visits / risk

Native splash → database open/migrate (truthful preparing messages) → custom splash → onboarding (first launch) → workspace selection → worker/admin login → (password change) → facility confirmation → PIN → optional biometrics → protected shell → clients → start visit / guided screening → priority assessment → Ask NorthCare (worker home entry).

Returning users with a local session: splash → unlock (PIN/biometric) → shell.

### Administration (Stage 16 + Reach R1)

Admin workspace registration flow: **identity → profession → facility → review → success**. Profession step collects controlled profession plus community/emergency request enablement (server-authoritative; no mobile SQLite workforce migration). Account details show the professional profile; legacy null profiles show as not configured with an add/edit screen.

Development-only: design-system preview, database preview, screening template preview, risk-engine preview, referral preview, voice-to-care preview, nutrition preview, **Ask NorthCare preview**. Hidden when `EXPO_PUBLIC_APP_ENV=production`.

## Related docs

- `docs/architecture/DATA_ARCHITECTURE.md`
- `docs/architecture/CLIENT_MANAGEMENT_ARCHITECTURE.md`
- `docs/architecture/SCREENING_TEMPLATE_VERSIONING.md`
- `docs/architecture/RISK_ENGINE_ARCHITECTURE.md`
- `docs/architecture/ASK_NORTHCARE_ARCHITECTURE.md`
- `docs/architecture/SQLITE_TECHNOLOGY_DECISION.md`
- `docs/architecture/AUTHENTICATION_ARCHITECTURE.md`
- `docs/architecture/NAVIGATION_DECISION.md`
- `docs/architecture/ROUTE_ARCHITECTURE.md`
- `docs/architecture/LAUNCH_STATE_MODEL.md`
- `docs/security/LOCAL_DATABASE_SECURITY.md`
- `docs/security/DATA_CLASSIFICATION.md`
- `docs/security/PIN_SECURITY_DESIGN.md`
- `docs/security/RISK_DATA_PRIVACY.md`
- `docs/security/ASSISTANT_DATA_PRIVACY.md`
- `docs/development/LOCAL_DATABASE_DIAGNOSTICS.md`
- `docs/development/DEPENDENCY_HEALTH.md`
- `docs/development/ANDROID_DEVELOPMENT_BUILD.md`
- `docs/development/ANDROID_STAGE_18_VALIDATION.md`
- `docs/accessibility/STAGE_18_ACCESSIBILITY_AUDIT.md`
- `docs/security/NORTHCARE_THREAT_MODEL.md`
- `docs/development/ANDROID_RISK_VALIDATION.md`
- `docs/development/ANDROID_ASSISTANT_VALIDATION.md`
- `docs/development/stages/STAGE_09_DETERMINISTIC_RISK_ENGINE.md`
- `docs/development/stages/STAGE_12_NUTRITION_GUIDANCE.md`
- `docs/development/stages/STAGE_13_ASK_NORTHCARE.md`
- `docs/architecture/NUTRITION_MANAGEMENT_ARCHITECTURE.md`
