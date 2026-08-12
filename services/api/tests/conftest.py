from __future__ import annotations

import os

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("NORTHCARE_ENV", "test")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://northcare@127.0.0.1:5432/northcare",
)
os.environ.setdefault("DEV_AUTH_SECRET", "test-dev-secret-at-least-32-bytes-long")
os.environ.setdefault("CURSOR_SIGNING_SECRET", "test-cursor-secret-at-least-32-bytes")
# Reach APIs are gated; integration tests that exercise them enable this explicitly.
os.environ.setdefault("NORTHCARE_REACH_DEMO_ENABLED", "false")


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
async def _dispose_async_engine() -> None:
    """Function-scoped event loops must not reuse pooled asyncpg connections."""
    from northcare_api.database import engine

    await engine.dispose()
    yield
    await engine.dispose()


@pytest.fixture
async def api_client() -> AsyncClient:
    from northcare_api.database import SessionLocal
    from northcare_api.main import app
    from northcare_api.seed.synthetic_dev_data import seed_synthetic

    async with SessionLocal() as session:
        await seed_synthetic(session)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
