# Assistant Data Privacy

**Stage:** 13  
**Date:** 2026-08-02

## Data classes

| Data | Classification | Storage |
|---|---|---|
| Knowledge-pack text | Governed reference content | Bundled TypeScript |
| In-session questions/answers | Sensitive (ephemeral) | Memory only |
| Feedback / content issues | Operational metadata | SQLite v7 tables |
| Audit events | Operational | Existing audit table — no raw query bodies |

## Auth gating

Ask routes are **protected-worker**. Signed-out and locked sessions are denied. Development preview is diagnostics-gated and hidden in production.

## Sync

Feedback/issue rows use local sync-status fields; Stage 13 does not implement network sync of assistant data.

## UI exposure

- No health information before authentication.
- Development banners on synthetic content.
- Article routes use ids — not patient names in paths.

## Deletion / lock

Clearing conversation on lock/logout removes ephemeral assistant UI state. Durable feedback rows follow general local-data lifecycle policies when deletion features expand.

## Related

- `ASSISTANT_QUERY_PRIVACY.md`
- `docs/security/DATA_CLASSIFICATION.md`
- `docs/architecture/ASSISTANT_KNOWLEDGE_STORAGE.md`
