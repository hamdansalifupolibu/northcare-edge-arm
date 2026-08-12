# Route Architecture

**Stage:** 4  
**Router:** Expo Router  

## Structure

```text
app/
  _layout.tsx                 Root providers, fonts, error boundary
  index.tsx                   Redirect into splash / launch-error
  (entry)/
    splash.tsx
    onboarding/
      care-close-to-home.tsx
      frontline-workers.tsx
      reliable-offline.tsx
    workspace-selection.tsx
    worker-entry.tsx          Future worker-auth boundary
    admin-entry.tsx           Future admin-auth boundary
    launch-error.tsx
  (worker)/                   Development-only shell preview
  (admin)/                    Development-only shell preview
  (development)/
    design-system-preview.tsx
```

## Access levels

| Group | Access |
|---|---|
| `(entry)` public screens | public / future-*-auth |
| `(worker)` / `(admin)` shells | development-only |
| Future protected feature routes | blocked until authentication (Stage 5+) |

## Android back principles

- Onboarding steps use stack history (previous page)
- Workspace entry → change workspace returns to selection
- Development routes `router.back()` or replace to safe entry
- Root back may exit the app at the OS level
- No splash ↔ index loops (`replace` used after splash)
