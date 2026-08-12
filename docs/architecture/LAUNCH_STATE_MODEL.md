# Launch State Model

**Stage:** 4  

## States

| State | Meaning |
|---|---|
| `preparing` | Fonts / preference load in progress |
| `firstLaunch` | Current onboarding version not completed |
| `onboardingComplete` | Onboarding done (intermediate; usually with workspace check) |
| `workspaceNotSelected` | Onboarding done; no workspace preference |
| `workerAuthenticationRequired` | Worker workspace selected; auth not implemented |
| `administratorAuthenticationRequired` | Admin workspace selected; auth not implemented |
| `launchError` | Preference read failure |

## Rules

- No state claims the user is authenticated.
- PIN / biometric / session restoration are Stage 5+ extension points.
- Splash always runs first, then `postSplashRoute(state)` selects the destination.

Implementation: `apps/mobile/src/launch/launchState.ts` + `LaunchProvider.tsx`.
