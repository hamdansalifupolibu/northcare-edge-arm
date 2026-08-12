# Navigation Decision

**Status:** LOCKED (Stage 4)  
**Last updated:** 2026-08-02  

## Selected approach

**Expo Router** (`expo-router` ~57.0.9) as the primary navigation architecture.

Expo Router uses React Navigation internally. No separate React Navigation tree is configured.

## Reason

- Expo SDK 57 first-party routing with typed routes and deep-link scheme support (`northcare`)
- File-based route groups for entry / worker / admin / development
- Avoids maintaining two competing navigation systems
- Matches the Stage 2 leading candidate once multi-screen navigation began

## Alternatives considered

| Approach | Outcome |
|---|---|
| Classic `App.tsx` entry only | Insufficient for multi-screen entry flows |
| Direct React Navigation without Expo Router | Viable, but duplicates Expo’s recommended path |
| Expo Router + parallel RN Navigation config | Rejected — competing architectures |

## Deep-link implications

Scheme: `northcare`  

Public Stage 4 entry paths are allowed. Protected / health-related patterns redirect to authentication boundaries. See `apps/mobile/src/navigation/deepLinks.ts` and `implementation/route-map.json`.

## Testing implications

- Unit tests cover launch-state resolution, preferences, route access, and deep-link policy
- Screen navigation integration relies on Expo Router; prefer route-policy and preference tests over full navigator mounts in Stage 4

## Future worker/admin shell implications

- `(worker)` and `(admin)` groups exist as development-only shell previews
- Protected production routes remain blocked until Stage 5 authentication

## Known limitations

- Exact future tab labels are documented as placeholders, not locked
- No authenticated session exists; shells must not imply login success
