# Environment and Secrets

**Purpose:** Secret-management policy for mobile, backend, and tooling.  
**Status:** Active  
**Last reviewed:** 2026-08-02  

## Public vs server-only

| Category | Examples | Visibility |
|---|---|---|
| Mobile public | `EXPO_PUBLIC_*` | Bundled into the client — **never private secrets** |
| Backend / server | `GOOGLE_APPLICATION_CREDENTIALS`, private API keys | Server/local only |
| Tooling | `STITCH_API_KEY` | Local uncommitted `.env` or CI secrets |

## Local uncommitted files

- `.env` (gitignored)  
- Service-account JSON under `secrets/` (gitignored)  
- Device keystores  

Use `.env.example` for names and placeholders only.

## CI secret storage (future)

When CI exists, store private keys in the CI provider’s secret store — never in workflow YAML or the repo.

## Rotation

1. Revoke/rotate the exposed credential at the provider.  
2. Update local `.env` / CI secrets.  
3. Record the incident privately (no secret values in git).  
4. Scan history if a secret may have been committed; scrub and rotate.

## Lost-secret procedure

Treat as compromised: rotate immediately, audit access logs if available, notify maintainers per `SECURITY.md`.

## Prohibitions

- No secrets in screenshots, chat prompts, logs, fixtures, or docs.  
- No committing service-account JSON.  
- No printing secret values in agent reports.  
- No private keys in `EXPO_PUBLIC_*`.

## Remediation note (Stage 1 audit)

A local `.env` file exists for tooling (e.g. Stitch). It must remain gitignored. If it was ever shared or committed elsewhere, rotate the Stitch API key.
