# Design System Location Decision

**Decision ID:** D-DS-01  
**Stage:** 3  
**Status:** Accepted  
**Last reviewed:** 2026-08-02  

## Decision

Implement the Stage 3 design system inside:

```text
apps/mobile/src/design-system/
```

with tokens in:

```text
apps/mobile/src/theme/
```

Do **not** create `packages/design-system` yet.

## Rationale

1. Expo Metro resolution for workspace packages needs extra configuration that is easy to get wrong mid-hackathon.
2. Stage 2 established a single active app at `apps/mobile/` with relative imports.
3. Reliable Android execution is preferred over premature monorepo abstraction.
4. Public export surface (`design-system/index.ts`) keeps a clean extraction boundary later.

## Consequences

- Feature screens import from `../design-system` (or equivalent relative path)
- Shared package extraction can happen after navigation/data layers stabilise
- `packages/` remains a placeholder for future extraction

## Revisit when

- A second Expo app or Storybook package needs the same components
- CI requires publishing a shared UI package
