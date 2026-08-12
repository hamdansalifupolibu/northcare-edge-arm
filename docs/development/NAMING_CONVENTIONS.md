# Naming Conventions

**Purpose:** Consistent names across TypeScript, Python, data, routes, and assets.  
**Status:** Active  
**Last reviewed:** 2026-08-02  

## TypeScript / React Native

| Kind | Convention |
|---|---|
| Components | PascalCase (`ClientCard.tsx`) |
| Hooks | `useCamelCase` (`useOfflineStatus.ts`) |
| Functions / variables | camelCase |
| True constants | SCREAMING_SNAKE_CASE |
| Non-component modules | kebab-case (`risk-engine.ts`) |
| Tests | `*.test.ts` / `*.test.tsx` |

## Python

| Kind | Convention |
|---|---|
| Modules | snake_case |
| Functions | snake_case |
| Classes | PascalCase |
| Constants | UPPER_SNAKE_CASE |
| Tests | `test_*.py` |

## Database

- Tables / columns: snake_case  
- IDs: UUID strings  
- Timestamps: UTC ISO 8601  
- Booleans: `is_`, `has_`, or `can_` prefixes  
- Sync fields: explicit (`sync_status`, `version`, `updated_at`)

## Routes

- Stable names; no casual renaming after implementation begins  
- Follow `implementation/route-map.json` once filled  

## Assets

- lowercase kebab-case  
- Descriptive; no spaces  
- No duplicated extensions (`file.png.png`)  
- No `final-final-2` naming  
