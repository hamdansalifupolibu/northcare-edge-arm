# Sync Data Privacy

- Synthetic fixtures only in development seed.
- Do not sync passwords, PINs, biometrics, raw QR tokens, or audio file URIs in ordinary payloads.
- API logging uses a redacting filter for sensitive terms (`password`, `token`, `authorization`, `payload`, etc.).
- Do not log full request/response bodies or health payloads.
- Lock-screen / notification surfaces must remain privacy-safe (no clinical detail).
- Conflict snapshots are persisted for resolution UI; they are not written to application logs.
