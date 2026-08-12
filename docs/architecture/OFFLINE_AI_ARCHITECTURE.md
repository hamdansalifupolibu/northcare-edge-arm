# Offline AI Architecture — Stage 1

## Summary

Stage 1 adds a development-only on-device inference path using `llama.rn` (llama.cpp) and a single locked GGUF model. It is intentionally isolated from Ask NorthCare.

## Components

| Area | Location |
|---|---|
| Feature module | `apps/mobile/src/features/offline-ai/` |
| Lifecycle service | `services/offlineAiLifecycle.ts` |
| Runtime adapter | `runtime/llamaRuntime.ts` |
| Provisioning | `provisioning/expoOfflineAiDownloader.ts` |
| Private storage | `storage/expoOfflineAiFileStore.ts` |
| Dev UI | `screens/OfflineAiDevScreen.tsx` |
| Route | `app/(development)/offline-ai.tsx` |
| Manifest | `implementation/offline-ai-model-manifest.json` |

## Runtime choice

- Package: `llama.rn@0.12.8` (MIT)
- Requires React Native New Architecture (already enabled)
- CPU inference (`n_gpu_layers: 0`)
- Expo config plugin with OpenCL/Hexagon disabled for Stage 1

## Boundaries

- No Ask NorthCare connection
- No cloud model endpoints
- No prompt/completion persistence
- Production builds cannot access the development route or provision models
