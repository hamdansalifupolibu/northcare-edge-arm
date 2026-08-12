# Stage 18 — Security Test Strategy

**Updated:** 2026-08-02

## Goals

Prove fail-closed behaviour for authz, development gates, deep links, QR parsing, logging redaction, and production transport configuration — without claiming penetration-test certification.

## Mobile focus

- Development features blocked in production
- Workspace / route guards
- Deep-link fail-closed
- QR negative tests
- Secure token storage / AsyncStorage absence of secrets
- Non-logging of passwords/PINs/transcripts/notes
- Sync conflict dirty-record retention

## Backend focus

- Cross-org/facility denial
- Role matrix
- Development auth blocked outside development/test
- Safe errors; no password verifier leakage
- Parameterised SQL

## Execution

```bash
# mobile
npm test

# api
pytest tests/security tests/integration -q
```
