# Offline AI Stage 1 — Native Runtime, Model Provisioning and Real Offline Inference

**Status:** Code complete; device evidence incomplete (S20 Ultra offline inference pending)  
**Product:** NorthCare AI  
**Date:** 2026-08-03

## Purpose

Prove that a real on-device GGUF model can be provisioned, loaded, and queried through `llama.rn` inside the existing Expo/React Native Android app while offline.

## Locked model

| Field | Value |
|---|---|
| Model | Qwen2.5-0.5B-Instruct |
| Repository | `Qwen/Qwen2.5-0.5B-Instruct-GGUF` |
| Revision | `9217f5db79a29953eb74d5343926648285ec7e67` |
| Filename | `qwen2.5-0.5b-instruct-q4_k_m.gguf` |
| Quantisation | Q4_K_M |
| Actual byte size | `491400032` |
| SHA-256 | `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db` |
| Runtime | `llama.rn@0.12.8` (MIT) |
| Acceleration | CPU first |

## Scope

- Native development build with `llama.rn`
- Development-only provisioning and smoke-test route `/(development)/offline-ai`
- Lifecycle service under `apps/mobile/src/features/offline-ai/`
- Manifest + supply-chain verification
- Airplane-mode inference proof on Samsung Galaxy S20 Ultra

## Out of scope

- Ask NorthCare generative integration (Stage 2)
- Stage 19
- Benchmarks, GPU/NPU dependency, medical prompts, cloud fallback

## Completion rule

Stage 1 is complete only when a real model response containing `OFFLINE_MODEL_READY` is produced on the Samsung Galaxy S20 Ultra while offline.
