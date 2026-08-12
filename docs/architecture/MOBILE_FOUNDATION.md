# Mobile Foundation

**Stage:** 2  
**Last updated:** 2026-08-02  

## Summary

NorthCare AI’s Android-first mobile foundation lives at:

```text
apps/mobile/
```

It is an Expo SDK 57 + React Native + TypeScript application with:

- Approved development identity (NorthCare AI / `northcare-ai`)
- Provisional Android package `com.northcareai.app`
- Strict TypeScript
- ESLint (`eslint-config-expo`)
- Jest (`jest-expo`) foundation tests
- Typed public environment parsing
- Privacy-safe logger abstraction
- Application error boundary
- Minimal startup gate (“Preparing NorthCare AI…”)
- Development foundation status screen (non-clinical)

## What Stage 2 intentionally excludes

- Health workflows, screening, referrals, nutrition
- Authentication / session restore
- SQLite / local database
- FastAPI / Firebase connectivity
- AI / local model libraries
- Administrator functionality
- Final navigation architecture
- Final Stitch design system / tokens (Stage 3)
- Website

## Key modules

| Concern | Path |
|---|---|
| Entry | `apps/mobile/index.ts`, `App.tsx` |
| Expo config | `apps/mobile/app.config.ts` |
| Env parsing | `apps/mobile/src/config/env.ts` |
| App config | `apps/mobile/src/config/appConfig.ts` |
| Metadata | `apps/mobile/src/constants/metadata.ts` |
| Logger | `apps/mobile/src/logging/logger.ts` |
| Error boundary | `apps/mobile/src/error/AppErrorBoundary.tsx` |
| Foundation UI | `apps/mobile/src/components/foundation/` |

## Runtime strategy

See `docs/architecture/EXPO_RUNTIME_STRATEGY.md`.

## Next stage

**Stage 3 — Design Tokens and Reusable Component Foundation**
