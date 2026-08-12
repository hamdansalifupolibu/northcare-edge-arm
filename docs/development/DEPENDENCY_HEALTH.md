# Dependency Health

**Stage:** Reach R1 (core Stages 1–18 unchanged)  
**Last updated:** 2026-08-03  

## Context

Packages are installed with `--legacy-peer-deps` because of a known React / tooling peer conflict observed in earlier stages. React and Expo were **not** upgraded in Stages 6–18 or Reach R0–R1.

## Preflight / Stage 18 baseline

| Check | Result |
|---|---|
| Package manager | npm (`apps/mobile/package-lock.json` present) |
| Metro / port 8081 | Free before package operations |
| Node | v22.21.1 |
| npm | 10.9.4 |
| Expo CLI (npx) | 57.0.11 |
| Expo SDK dependency | `expo ~57.0.9` |
| React Native | 0.86.2 |
| React | 19.2.3 |
| Python (API venv) | 3.12.10 |
| Host Python | 3.14.0 (not used for API venv) |
| PostgreSQL | 16.2 |
| Android SDK | Present under `%LOCALAPPDATA%\Android\Sdk` (platforms 34–36) |
| ADB | 1.0.41; emulator-5554 attached |
| New mobile runtime packages in Stage 18 | **None** |
| New API runtime packages in Stage 18 | **None** |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `pip audit` | Tool unavailable in environment |
| Push / analytics / root-detection SDKs | Not installed |

## Reach R1

| Check | Result |
|---|---|
| Alembic head | **`0004`** (`worker_professional_profiles`; was `0003`) |
| New mobile runtime packages | **None** |
| New API runtime packages | **None** |
| Mobile SQLite migration | **None** (server-authoritative admin profiles) |
| OpenAPI paths | **24** (regenerated) |

## Install commands used

None for new dependencies. Expo prebuild may add `android`/`ios` script entries only.

## Policy

- Prefer Expo SDK-compatible packages.
- Do **not** run package installs while Metro is active.
- Re-run `npm run doctor` after dependency changes.
- Do not upgrade Expo / React / React Native during Reach stages without explicit approval.
- Prefer zero new runtime packages; document any exception.
