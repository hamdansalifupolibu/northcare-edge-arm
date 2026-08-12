# Offline AI Stage 1 Test Strategy

## Automated (mocks allowed)

- Manifest validation / size / model id / quantisation
- Missing model, checksum mismatch, partial cleanup
- State transitions and duplicate-operation prevention
- Generation-before-load rejection
- Safe release
- Development route access / production denial
- Error mapping
- No prompt persistence
- No network inference fallback
- Ask NorthCare remains non-generative

Feature suite: `apps/mobile/src/features/offline-ai/__tests__/`

## Device evidence (required for completion)

On Samsung Galaxy S20 Ultra:

1. Install development build
2. Provision/verify model
3. Load model
4. Smoke completion contains `OFFLINE_MODEL_READY`
5. Airplane-mode completion
6. Release + reload
7. Short sequential stability check

Mocks do not replace device evidence.
