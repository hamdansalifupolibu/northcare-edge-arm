# Offline AI Model Provisioning — Stage 1

## Method

Development-gated download or operator import into app-private storage.

Flow:

1. Show expected model size from manifest
2. Check free storage when practical
3. Download/import into a temporary private file
4. Verify byte size
5. Verify SHA-256
6. Atomically move into the final private model path
7. Mark ready only after verification

## Manifest

`implementation/offline-ai-model-manifest.json`

Verified local download (2026-08-03):

- size `491400032`
- sha256 `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db`

## Restrictions

- Not automatic at launch
- Production provisioning blocked
- Partial downloads cleaned up
- Weights never committed to Git
