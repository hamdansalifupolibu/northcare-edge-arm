# Onboarding Persistence

**Stage:** 4  
**Storage:** `@react-native-async-storage/async-storage` 2.2.0  

## Stored (non-sensitive)

| Key | Value |
|---|---|
| `@northcare/onboardingVersionCompleted` | integer version |
| `@northcare/selectedWorkspace` | `worker` \| `administrator` |

## Not stored

Passwords, PINs, tokens, client or health information.

## Versioning

`CURRENT_ONBOARDING_VERSION = 1`  

Completion is versioned so future onboarding revisions can be presented responsibly.

## API

`AppPreferencesRepository` in `apps/mobile/src/preferences/`.

Development-only reset is available from the design-system preview route. It is not shown in production.
