# Contributing to NorthCare AI

**Last reviewed:** 2026-08-02

Thank you for contributing to a health-technology project that must remain safe, respectful, and offline-capable.

## Before you change code

1. Read `README.md`, `AGENTS.md`, and `PROJECT_STATUS.md`.  
2. Read the **current approved stage** under `docs/development/stages/`.  
3. Read `docs/development/SOURCE_OF_TRUTH.md`.  
4. Do not implement outside the approved stage.

## Stage approval

- Work proceeds stage-by-stage.  
- Complete the checkpoint template after each stage.  
- Do not start the next stage without approval.

## Branches and commits

See `docs/development/GIT_WORKFLOW.md`.

- Prefer `stage/NN-short-name` or `feature/...` / `fix/...`  
- Conventional commits: `type(scope): description`  
- Do not commit secrets or real patient data.

## Testing and documentation

- Add or update tests required by the stage (`docs/testing/`).  
- Update docs in the same change set when behaviour or structure changes.  
- Meet `docs/development/DEFINITION_OF_DONE.md`.

## Assets and brand

- Use organised assets under `assets/` only.  
- Do not forge logos or invent partner marks.  
- Canonical logo (interim): `assets/brand/logos/northcare-logo-symbol-primary.png`.  
- Do not treat artistic maps as geographic truth.

## Health content and language

- Do not invent medical protocols, nutrition guidance, or Dagbanli translations.  
- Approved content requires documented review.  
- Deterministic safety rules override chatbot text.

## Security and privacy

- Synthetic data only (`docs/testing/SYNTHETIC_DATA_POLICY.md`).  
- No secrets in the repo (`docs/development/ENVIRONMENT_AND_SECRETS.md`).  
- No health data in logs (`docs/development/LOGGING_POLICY.md`).  
- Report vulnerabilities per `SECURITY.md`.

## Pull requests

Use `.github/PULL_REQUEST_TEMPLATE.md` and confirm:

- Scope matches stage  
- Tests / docs / accessibility / offline / security reviewed  
- No real patient data, no secrets, no invented medical content  
- Stitch alignment checked for UI work
