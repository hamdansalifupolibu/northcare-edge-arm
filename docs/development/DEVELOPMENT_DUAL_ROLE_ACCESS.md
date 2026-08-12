# Development dual-role access

**Environment:** development only  
**Policy:** DEVELOPMENT TESTING ONLY — see `DUAL_ROLE_ACCOUNT_POLICY.md`

## Account

| Field | Value |
|---|---|
| Email | `hamdansalifupolibu@gmail.com` |
| Roles | `worker`, `admin` |
| Worker facility | `fac-dev-001` |
| Organisation | synthetic `org-dev-001` |
| Purpose | Local / hackathon dual-workspace testing |

The password is never stored in this repository. Provision or rotate it only through the local CLI with hidden prompts.

## Provisioning

From `services/api` after migrations and synthetic seed:

```powershell
$env:NORTHCARE_ENV = "development"
$env:DATABASE_URL = "postgresql+asyncpg://northcare@127.0.0.1:5432/northcare"
.\.venv\Scripts\python.exe -m northcare_api.cli.provision_development_account `
  --email hamdansalifupolibu@gmail.com `
  --roles worker admin `
  --update-existing
```

The CLI prompts twice via `getpass` (or `--stdin-password` for local automation). It stores an Argon2id verifier only, refuses non-development environments, and prints a safe summary (account id, roles, facility) without password or verifier values.

## Expected mobile behaviour after sign-in

1. Server returns both roles and permitted workspaces `worker` + `administration`.
2. Post-login workspace selection appears (do not auto-enter Administration).
3. Health Worker workspace exposes clinical navigation only.
4. Administration workspace exposes account management only.
5. Switch workspace clears unsafe route history.

## Related CLIs

- Worker-only: `northcare_api.cli.provision_development_worker`
- Dual-role: `northcare_api.cli.provision_development_account`
