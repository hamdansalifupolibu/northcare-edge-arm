# Backend Local Setup

## Preferred team path (Docker)

```bash
docker compose up --build
docker compose exec api python scripts/seed_dev.py
```

Requires Docker engine. On this validation host Docker CLI was **absent**.

## Validated path (portable PostgreSQL)

1. Start portable PostgreSQL 16.x on `127.0.0.1:5432` (data dir `.tools/pgdata`).
2. Create venv in `services/api` (or outside OneDrive if locked).
3. `pip install -e ".[dev]"`.
4. Copy `.env.example` → `.env` (never commit).
5. `alembic upgrade head`
6. `python scripts/seed_dev.py`
7. `uvicorn northcare_api.main:app --host 127.0.0.1 --port 8000`

Health: `/health/live`, `/health/ready`.

## Tests

See `docs/testing/BACKEND_TEST_STRATEGY.md`.
