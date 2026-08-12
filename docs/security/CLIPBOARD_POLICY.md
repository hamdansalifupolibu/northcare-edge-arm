# Clipboard Policy (Stage 18)

**Updated:** 2026-08-02

## Policy

1. Do not auto-copy passwords, PINs, access tokens, or raw QR bearer tokens to the clipboard.
2. Temporary admin passwords shown in Administration UI should require explicit worker/admin copy action if copy is offered; prefer display + retype.
3. Clinical free-text should not be silently placed on the clipboard.
4. Paste into password fields is allowed by the OS; values must never be logged.

## Implementation honesty

- Stage 18 documents the policy; no new clipboard SDK was added.
- Existing UI must not introduce silent clipboard writes for secrets.
