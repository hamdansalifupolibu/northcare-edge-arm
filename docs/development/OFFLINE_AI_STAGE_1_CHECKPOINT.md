# Offline AI Stage 1 Checkpoint

**Stage:** Offline AI Stage 1 — Native Runtime, Model Provisioning and Real Offline Inference  
**Status:** COMPLETE  
**Stage 19 status:** Paused (unchanged)  
**Date:** 2026-08-04  
**Approval required:** Checkpoint recorded — device evidence complete on Samsung Galaxy S20 Ultra

## Exact completion statement

**OFFLINE AI STAGE 1 COMPLETE**

## Freeze fix

- **Root cause:** `loadModel()` hashed the full ~491 MB GGUF on the JS thread before `initLlama`.
- **Fix:** Size-gated load; yielding during explicit verify hash; development automation bridge for unattended harness.

## Device / install evidence

| Item | Result |
|---|---|
| Samsung Galaxy S20 Ultra | Pass (`SM-G988B`, USB `R5CN404ZDHK`) |
| App package | `com.northcareai.app` |
| Model on device | `files/offline-ai-models/qwen2.5-0.5b-instruct-q4_k_m.gguf` |
| On-device size | `491400032` |
| Host SHA-256 | `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db` |

## Inference / stability / offline evidence

| Item | Result |
|---|---|
| Model-load (online) | Pass — 1539 ms / reload 1286 ms |
| Smoke (online) | Pass — `OFFLINE_MODEL_READY` (~33.8 tok/s) |
| Release → reload → smoke | Pass (`stabilityOk=true`) |
| Airplane-mode load | Pass — 985 ms |
| Airplane-mode smoke | Pass — `OFFLINE_MODEL_READY`, **`offline=true`**, 579 ms, ~38.1 tok/s |
| Ask NorthCare (Stage 1 scope) | Stage 1 harness remains separate from Ask NorthCare product wiring |

Authoritative device log summary: `docs/testing/OFFLINE_AI_STAGE_1_DEVICE_RESULT.md`.

## Runtime / model

| Field | Value |
|---|---|
| Expo / RN | ~57.0.9 / 0.86.2 |
| New Architecture | Enabled |
| llama.rn | 0.12.8 (MIT) |
| Model | Qwen2.5-0.5B-Instruct Q4_K_M |
| Context / max out / threads | 2048 / 120 / 4 |
| Acceleration | CPU (`n_gpu_layers: 0`) |

## Quality gates

| Gate | Result |
|---|---|
| Offline AI unit tests | **18** passed / **4** suites (post freeze-fix) |
| Airplane-mode device evidence | Pass |

## Git status

No commit created unless explicitly requested.

## Recommended later scope (do not auto-start from this checkpoint)

Ask NorthCare offline provider integration remains a separate track from this Stage 1 completion statement.
