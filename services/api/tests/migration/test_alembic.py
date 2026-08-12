from __future__ import annotations

import asyncio
import os
import subprocess
import uuid
from pathlib import Path

import asyncpg

API_ROOT = Path(__file__).resolve().parents[2]
PG_HOST = "127.0.0.1"
PG_PORT = 5432
PG_USER = "northcare"
PG_PASSWORD = os.environ.get("PGPASSWORD", "")


def _dsn(database: str) -> str:
    auth = PG_USER if not PG_PASSWORD else f"{PG_USER}:{PG_PASSWORD}"
    return f"postgresql://{auth}@{PG_HOST}:{PG_PORT}/{database}"


def _async_dsn(database: str) -> str:
    return _dsn(database).replace("postgresql://", "postgresql+asyncpg://", 1)


def _run_alembic(args: list[str], database: str) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["DATABASE_URL"] = _async_dsn(database)
    env["PYTHONPATH"] = str(API_ROOT / "src")
    return subprocess.run(
        [str(API_ROOT / ".venv" / "Scripts" / "alembic.exe"), *args],
        cwd=str(API_ROOT),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


async def _fetchval(database: str, sql: str) -> object:
    conn = await asyncpg.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, database=database)
    try:
        return await conn.fetchval(sql)
    finally:
        await conn.close()


async def _fetch(database: str, sql: str) -> list[asyncpg.Record]:
    conn = await asyncpg.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, database=database)
    try:
        return await conn.fetch(sql)
    finally:
        await conn.close()


async def _admin_execute(sql: str) -> None:
    conn = await asyncpg.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, database="postgres")
    try:
        await conn.execute(sql)
    finally:
        await conn.close()


def test_alembic_heads_is_0006() -> None:
    result = _run_alembic(["heads"], "northcare")
    assert result.returncode == 0, result.stderr
    assert "0006" in result.stdout


def test_applied_revision_is_0006() -> None:
    version = asyncio.run(_fetchval("northcare", "SELECT version_num FROM alembic_version"))
    assert version == "0006"


def test_upgrade_head_is_idempotent() -> None:
    first = _run_alembic(["upgrade", "head"], "northcare")
    second = _run_alembic(["upgrade", "head"], "northcare")
    assert first.returncode == 0, first.stderr
    assert second.returncode == 0, second.stderr


def test_fresh_database_migration_and_downgrade_status() -> None:
    db_name = f"northcare_mig_{uuid.uuid4().hex[:10]}"

    async def _setup() -> None:
        await _admin_execute(f'CREATE DATABASE "{db_name}"')

    async def _cleanup() -> None:
        await _admin_execute(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            f"WHERE datname = '{db_name}' AND pid <> pg_backend_pid()"
        )
        await _admin_execute(f'DROP DATABASE IF EXISTS "{db_name}"')

    asyncio.run(_setup())
    try:
        upgrade = _run_alembic(["upgrade", "head"], db_name)
        assert upgrade.returncode == 0, upgrade.stderr + upgrade.stdout
        version = asyncio.run(_fetchval(db_name, "SELECT version_num FROM alembic_version"))
        tables = {
            r["tablename"]
            for r in asyncio.run(
                _fetch(
                    db_name,
                    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
                )
            )
        }
        assert version == "0006"
        for required in (
            "sync_records",
            "sync_changes",
            "sync_operations",
            "sync_conflicts",
            "registered_devices",
            "development_credentials",
            "server_account_roles",
            "administration_audit_events",
            "admin_idempotency_keys",
            "worker_professional_profiles",
            "community_requests",
        ):
            assert required in tables
        down = _run_alembic(["downgrade", "base"], db_name)
        assert down.returncode in (0, 1)
        if down.returncode == 0:
            remaining = {
                r["tablename"]
                for r in asyncio.run(
                    _fetch(
                        db_name,
                        "SELECT tablename FROM pg_tables WHERE schemaname='public'",
                    )
                )
            }
            assert "sync_records" not in remaining
            assert "community_requests" not in remaining
    finally:
        asyncio.run(_cleanup())


def test_upgrade_from_0004_preserves_accounts_and_profiles() -> None:
    db_name = f"northcare_r2_{uuid.uuid4().hex[:10]}"

    async def _setup() -> None:
        await _admin_execute(f'CREATE DATABASE "{db_name}"')

    async def _cleanup() -> None:
        await _admin_execute(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            f"WHERE datname = '{db_name}' AND pid <> pg_backend_pid()"
        )
        await _admin_execute(f'DROP DATABASE IF EXISTS "{db_name}"')

    asyncio.run(_setup())
    try:
        to_r1 = _run_alembic(["upgrade", "0004"], db_name)
        assert to_r1.returncode == 0, to_r1.stderr + to_r1.stdout

        async def _seed() -> None:
            conn = await asyncpg.connect(
                host=PG_HOST, port=PG_PORT, user=PG_USER, database=db_name
            )
            try:
                await conn.execute(
                    "INSERT INTO server_facilities "
                    "(id, name, organisation_id, is_active) "
                    "VALUES ('fac-dev-001', 'Demo', 'org-dev-001', true)"
                )
                await conn.execute(
                    "INSERT INTO server_accounts "
                    "(id, remote_subject, display_name, role, organisation_id, "
                    "facility_id, is_active, account_version, account_status, "
                    "identity_provider) "
                    "VALUES ('dev-preserve-001', 'dev-preserve-001', 'Preserve', "
                    "'worker', 'org-dev-001', 'fac-dev-001', true, 1, 'active', "
                    "'development')"
                )
                await conn.execute(
                    "INSERT INTO server_account_roles "
                    "(id, account_id, role, status) "
                    "VALUES ('role-preserve-001', 'dev-preserve-001', 'worker', 'active')"
                )
                await conn.execute(
                    "INSERT INTO worker_professional_profiles "
                    "(account_id, profession, community_requests_enabled, "
                    "emergency_requests_enabled, version) "
                    "VALUES ('dev-preserve-001', 'midwife', true, false, 1)"
                )
            finally:
                await conn.close()

        asyncio.run(_seed())
        to_head = _run_alembic(["upgrade", "head"], db_name)
        assert to_head.returncode == 0, to_head.stderr + to_head.stdout
        version = asyncio.run(_fetchval(db_name, "SELECT version_num FROM alembic_version"))
        assert version == "0006"
        account = asyncio.run(
            _fetchval(db_name, "SELECT id FROM server_accounts WHERE id='dev-preserve-001'")
        )
        assert account == "dev-preserve-001"
        profession = asyncio.run(
            _fetchval(
                db_name,
                "SELECT profession FROM worker_professional_profiles "
                "WHERE account_id='dev-preserve-001'",
            )
        )
        assert profession == "midwife"
        has_table = asyncio.run(
            _fetchval(
                db_name,
                "SELECT tablename FROM pg_tables "
                "WHERE schemaname='public' AND tablename='community_requests'",
            )
        )
        assert has_table == "community_requests"
    finally:
        asyncio.run(_cleanup())
