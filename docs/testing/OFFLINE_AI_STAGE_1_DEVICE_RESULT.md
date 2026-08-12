# Offline AI Stage 1 Device Result

**Date:** 2026-08-04  
**Status:** COMPLETE — online, stability, and airplane-mode evidence captured on S20 Ultra

## Device

| Field | Result |
|---|---|
| Device | Samsung Galaxy S20 Ultra (`SM-G988B`, Android 13) |
| Package | `com.northcareai.app` |
| USB serial | `R5CN404ZDHK` |
| Model path | `/data/user/0/com.northcareai.app/files/offline-ai-models/qwen2.5-0.5b-instruct-q4_k_m.gguf` |
| On-device size | `491400032` (matches manifest) |
| Host SHA-256 (pre-install) | `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db` |
| Install method | PC → phone netcat transfer + `run-as` copy into app-private files |

## Freeze root cause and fix

| Item | Detail |
|---|---|
| Symptom | App froze after **Load model** |
| Root cause | Full JS SHA-256 of ~491 MB GGUF on the React Native JS thread before `initLlama` |
| Fix | Size-gated load; yielding during explicit hash; unattended harness via trigger file |

## Online + stability evidence (logcat `OFFLINE_AI_STAGE1_EVIDENCE`)

| Event | Result |
|---|---|
| refresh | `state=ready`, `modelBytes=491400032`, `native=true` |
| loaded | `loadMs=1539` |
| smoke | `OFFLINE_MODEL_READY`, `completionMs=715`, `tokensPerSecond≈33.77`, `offline=false` |
| stability | `ok=true`, reload `loadMs=1286`, `completionMs=694` |
| complete | `ok=true`, `stabilityOk=true` |

## Airplane-mode evidence (logcat `OFFLINE_AI_STAGE1_EVIDENCE`)

Captured 2026-08-04 ~01:18 with `airplane_mode_on=1`:

| Event | Result |
|---|---|
| start | `mode=airplane` |
| refresh | `state=ready`, `modelBytes=491400032`, `native=true` |
| loaded | `loadMs=985` |
| smoke | `containsExpectedPhrase=true`, preview=`OFFLINE_MODEL_READY`, `completionMs=579`, `tokensPerSecond≈38.12`, **`offline=true`** |
| complete | **`ok=true`**, phrase=`OFFLINE_MODEL_READY` |

Airplane mode was disabled after the run (`airplane_mode_on=0`).

## Required evidence checklist

| Check | Result |
|---|---|
| S20 Ultra authorised | Pass |
| App installed / launched | Pass |
| Model present + size verified | Pass |
| Model loaded via llama.rn | Pass |
| Smoke contains `OFFLINE_MODEL_READY` | Pass |
| Airplane-mode completion | **Pass** (`offline=true`) |
| Release + reload stability | Pass |

## Notes

- Stage 1 harness is development-only and does not replace Ask NorthCare Stage 2 work
- No patient/health data logged in evidence lines
