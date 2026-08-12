# Server Database Migrations

**Stage:** 14  
**Tool:** Alembic  
**Database:** PostgreSQL

## Location

- Config: `services/api/alembic.ini`
- Env: `services/api/alembic/env.py`
- Revisions: `services/api/alembic/versions/`

## Current head

| Revision | Description |
|---|---|
| `0001` | Initial sync schema: accounts, facilities, devices, sync_records, sync_operations, sync_changes, sync_conflicts |

## Commands

```bash
cd services/api
$env:PYTHONPATH="src"
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic revision -m "description"
```

## Rules

- Never drop clinical history without an approved migration plan
- Prefer additive migrations
- Seed synthetic development data only via explicit `scripts/seed_dev.py`
