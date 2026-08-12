# Dependency and Supply-Chain Audit (Stage 18)

**Updated:** 2026-08-02  
**Policy:** Prefer zero new runtime packages; no Expo/React/RN upgrade; no analytics/session-recording/root-detection SDKs.

## Mobile (`apps/mobile`)

| Check | Result |
|---|---|
| Package manager | npm + `package-lock.json` |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm audit` (all, earlier) | 11 moderate in tooling/dev tree — **deferred**, not force-upgraded (would risk Expo/React churn) |
| New runtime packages Stage 18 | **None** |
| SBOM | Not generated — no pre-approved SBOM tool installed; inventories used instead |

Inventory: `implementation/mobile-dependency-inventory.json`

## API (`services/api`)

| Check | Result |
|---|---|
| Package manager | pip / `pyproject.toml` |
| `pip audit` | **Not available** in environment (`pip` has no `audit` command) |
| Manual review | Runtime set unchanged in Stage 18 (FastAPI, SQLAlchemy, Alembic, PyJWT, argon2-cffi, firebase-admin optional path, httpx) |
| New runtime packages Stage 18 | **None** |

Inventory: `implementation/api-dependency-inventory.json`

## High-risk findings

| Finding | Severity | Action |
|---|---|---|
| Dev-tree moderate npm advisories | Moderate | Documented deferral — revisit in Stage 19 with Expo-compatible upgrades only |
| pip audit tool missing | Process | Deferred; do not invent SBOM tooling mid-stage |

## Supply-chain controls retained

- Lockfile present for mobile
- Prefer Expo-compatible packages only
- Do not install while Metro is active
- Secrets never in dependencies or committed env files
