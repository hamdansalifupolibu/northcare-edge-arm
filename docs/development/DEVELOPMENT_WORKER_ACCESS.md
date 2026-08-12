# Development worker access

Development credential login is available only when `NORTHCARE_ENV=development` (and test harnesses that enable the same gate); staging and production return a not-found response. It is not public registration.

## Owner development account

- Email: `hamdansalifupolibu@gmail.com`
- Roles: see `DEVELOPMENT_DUAL_ROLE_ACCESS.md` (dual-role development testing)
- Worker facility: synthetic `fac-dev-001` (Demo CHPS Compound)
- Organisation: synthetic `org-dev-001`
- Purpose: NorthCare AI development and device testing

Never store or print this account’s password in source, fixtures, docs, `.env.example`, CLI args, logs, or chat. Use a hidden local prompt only.

## Provisioning

### Worker-only

```powershell
$env:NORTHCARE_ENV="development"
.\.venv\Scripts\python.exe -m northcare_api.cli.provision_development_worker --email hamdansalifupolibu@gmail.com
```

### Dual-role (development testing only)

```powershell
$env:NORTHCARE_ENV="development"
.\.venv\Scripts\python.exe -m northcare_api.cli.provision_development_account `
  --email hamdansalifupolibu@gmail.com `
  --roles worker admin `
  --update-existing
```

Both commands use hidden `getpass` prompts (or secure stdin for local automation), require at least 12 characters with upper-case, lower-case, and digit characters, and store an Argon2id verifier only. They never accept a password CLI argument and never print a password or verifier. They refuse non-development environments.

## Login behaviour

The development token endpoint accepts an email or synthetic account identifier, ignores client-supplied role and facility fields, and returns server-resolved roles, permitted workspaces, facility, and account status. Mobile development email login calls this API; offline demo identifiers (`dev-worker-001`, etc.) remain available for local prototype use.
