# Local Assistant Model Evaluation

**Stage:** 13  
**Date:** 2026-08-02

## Status

**MODEL INTEGRATION DEFERRED — DEVICE AND SAFETY BENCHMARK REQUIRED**

## Current packages

| Technology | Stage 13 |
|---|---|
| llama / ggml / gguf runtimes | **Not installed** |
| ONNX / TensorFlow / ML Kit generative | **Not installed** |
| Cloud LLM SDKs | **Not installed** |
| Whisper / speech LLM | **Not installed** (see Stage 11) |

Zero new npm packages were added for Stage 13 generative capability.

## Provider stub

`futureConstrainedGenerativeProvider` (`providers/futureGenerative/constrainedAssistantProvider.ts`):

- Mode: `CONSTRAINED_GENERATION`
- `available: false`
- Throws `providerUnavailable` if invoked

## Preconditions before any on-device model work

1. Device memory / thermal / battery benchmarks on target Samsung hardware.
2. Offline latency budget for grounded answer generation.
3. Approved prompt / schema / refusal evaluation suite.
4. Safety review against diagnosis, treatment, dosage, and urgent-request policies.
5. Explicit product approval to leave retrieval-only mode.
6. Documented Expo runtime impact (likely development build — see `EXPO_RUNTIME_STRATEGY.md`).

## Until then

Stage 13 remains **retrieval-only** or **unavailable**. Do not ship a hidden generative path.

## Related

- `ASSISTANT_MODE_DECISION.md`
- `implementation/assistant-provider-inventory.json`
