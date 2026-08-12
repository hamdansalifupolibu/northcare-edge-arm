# Dual-role account policy

**DEVELOPMENT TESTING ONLY — PRODUCTION ASSIGNMENT DEFERRED**

## Purpose

A single development account may hold both `worker` and `admin` roles so one operator can validate frontline clinical workflows and administration workflows without maintaining two personal identities.

## Rules

- Dual-role assignment is available only through the development CLI.
- Ordinary Administration UI registers **worker** accounts only.
- Ordinary UI must not offer admin, dual-role, or organisation escalation controls.
- Staging and production dual-role assignment is not implemented.
- Production administrator bootstrap is out of scope for Stage 16.
- Workspace selection is mandatory when more than one workspace is permitted.
- Worker workspace cannot manage accounts.
- Administration workspace cannot browse clinical records.
- Backend role assignments remain authoritative after every refresh.

## Provisioning

Use `python -m northcare_api.cli.provision_development_account` with `--roles worker admin` and `--update-existing` when replacing an existing credential. Password entry uses hidden prompts or secure stdin. Passwords and verifiers must never appear in repository files, docs, fixtures, OpenAPI examples, logs, or audit payloads.

## Related

- `docs/development/DEVELOPMENT_DUAL_ROLE_ACCESS.md`
- `docs/security/ADMINISTRATOR_CLINICAL_ACCESS_BOUNDARY.md`
