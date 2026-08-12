from __future__ import annotations

import io
from unittest import mock

import pytest

from northcare_api.cli import provision_development_account as cli
from northcare_api.domain.enums import AccountRole


@pytest.mark.asyncio
async def test_provision_rejects_non_development(monkeypatch: pytest.MonkeyPatch) -> None:
    class Settings:
        northcare_env = "production"

    monkeypatch.setattr(cli, "get_settings", lambda: Settings())
    code = await cli.provision(
        "worker@example.com",
        ["worker", "admin"],
        update_existing=False,
        non_interactive=True,
    )
    assert code == 2


@pytest.mark.asyncio
async def test_provision_creates_dual_role(monkeypatch: pytest.MonkeyPatch) -> None:
    class Settings:
        northcare_env = "development"

    monkeypatch.setattr(cli, "get_settings", lambda: Settings())

    password = "DynTestPass12A"
    stdin = io.StringIO(f"{password}\n{password}\n")
    monkeypatch.setattr(cli.sys, "stdin", stdin)

    created: dict[str, object] = {}

    class FakeFacility:
        id = "fac-dev-001"

    class FakeSession:
        async def get(self, model, key):  # type: ignore[no-untyped-def]
            name = getattr(model, "__name__", str(model))
            if name == "ServerFacility":
                return FakeFacility()
            return None

        def add(self, obj):  # type: ignore[no-untyped-def]
            created.setdefault("added", []).append(obj)  # type: ignore[index]

        async def flush(self) -> None:
            return None

        async def commit(self) -> None:
            created["committed"] = True

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

    class FakeSessionLocal:
        def __call__(self):
            return FakeSession()

    monkeypatch.setattr(cli, "SessionLocal", FakeSessionLocal())

    async def fake_ensure_role_assignment(session, *, account_id, role, assigned_by):  # type: ignore[no-untyped-def]
        created.setdefault("roles", []).append(role)  # type: ignore[index]

    async def fake_write_audit(*args, **kwargs):  # type: ignore[no-untyped-def]
        created["audit"] = kwargs.get("event_type")

    monkeypatch.setattr(cli, "ensure_role_assignment", fake_ensure_role_assignment)
    monkeypatch.setattr(cli, "write_audit", fake_write_audit)

    monkeypatch.setattr(cli, "_HASHER", mock.Mock(hash=lambda value: "argon2-hash"))
    code = await cli.provision(
        "  Dual.Role@Example.COM ",
        ["worker", "admin"],
        update_existing=True,
        non_interactive=True,
    )
    assert code == 0
    assert created.get("committed") is True
    assert set(created.get("roles", [])) == {AccountRole.WORKER, AccountRole.ADMIN}
    assert created.get("audit") == "developmentDualRoleProvisioned"
