# Source of Truth

**Purpose:** Define authority order when materials conflict.  
**Status:** Active  
**Last reviewed:** 2026-08-02  

## Authority order (highest first)

1. Approved product and safety requirements (`docs/product/`, `docs/safety/` when present, `PROJECT_PRINCIPLES`)  
2. Approved project documentation (`docs/`, `AGENTS.md`, stage specs)  
3. Approved Stitch **final** screens (project `749026157623860355`)  
4. Approved design tokens (Stitch / future `implementation/design-tokens.json`)  
5. Approved asset manifest (`implementation/asset-manifest.json`) and organised `assets/`  
6. Approved route and screen inventories (`implementation/route-map.json`, `screen-inventory.json`)  
7. Current stage specification (`docs/development/stages/`)  
8. Application implementation (code)  
9. Archived or reference material (`assets/source-*`, draft Stitch variants)

## Clarifications

| Topic | Rule |
|---|---|
| Stitch HTML | Visual reference only — **not** production React Native |
| Screenshots | Must not be used as full application interfaces |
| Dynamic text | Remains real UI text components |
| Assets | Do not forge or silently replace approved files |
| Archived screens | Do not implement unless reapproved |
| Logo | Canonical (interim): PNG `assets/brand/logos/northcare-logo-symbol-primary.png` |
| Stitch SVG logos | Require visual approval before replacing PNG |
| Artistic Ghana maps / care-network paths | Not geographic or routing truth |
| Reviewed health content | Overrides generated AI suggestions |
| Deterministic safety rules | Override ordinary chatbot responses |

## Assumptions

- Stitch “final” labels in design docs remain the default UI target unless product docs supersede them.  
- Open technical decisions in `docs/architecture/TECHNICAL_DECISIONS_REQUIRED.md` are not yet truth.
