from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from httpx import AsyncClient
from sqlalchemy import update

from northcare_api.config import Settings, get_settings
from northcare_api.database import SessionLocal
from northcare_api.domain.models import RegisteredDevice, ServerAccount
from northcare_api.main import app
from northcare_api.seed.synthetic_dev_data import seed_synthetic
from tests.helpers import auth_headers, client_payload, make_op, push, register_device


@pytest.mark.asyncio
async def test_missing_bearer_token(api_client: AsyncClient) -> None:
    resp = await api_client.get("/v1/sync/changes")
    assert resp.status_code == 401
    assert resp.json()["detail"]["code"] == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_invalid_token(api_client: AsyncClient) -> None:
    resp = await api_client.get(
        "/v1/sync/changes",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_expired_development_token(api_client: AsyncClient) -> None:
    settings = get_settings()
    token = jwt.encode(
        {
            "sub": "dev-worker-001",
            "iat": datetime.now(UTC) - timedelta(hours=2),
            "exp": datetime.now(UTC) - timedelta(hours=1),
            "iss": "northcare-development",
        },
        settings.dev_auth_secret,
        algorithm="HS256",
    )
    resp = await api_client.get(
        "/v1/sync/changes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_development_route_disabled_outside_development() -> None:
    from httpx import ASGITransport
    from httpx import AsyncClient as AC

    original = app.dependency_overrides.get(get_settings)

    def staging_settings() -> Settings:
        return Settings(
            NORTHCARE_ENV="staging",
            DATABASE_URL="postgresql+asyncpg://northcare@127.0.0.1:5432/northcare",
            DEV_AUTH_SECRET="test-dev-secret-at-least-32-bytes-long",
            CURSOR_SIGNING_SECRET="test-cursor-secret-at-least-32-bytes",
        )

    app.dependency_overrides[get_settings] = staging_settings
    try:
        transport = ASGITransport(app=app)
        async with AC(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/v1/development/auth/token",
                json={"account_id": "dev-worker-001", "password": "WorkerDemo1!"},
            )
        assert resp.status_code == 404
    finally:
        if original is None:
            app.dependency_overrides.pop(get_settings, None)
        else:
            app.dependency_overrides[get_settings] = original


@pytest.mark.asyncio
async def test_unknown_account_token_rejected(api_client: AsyncClient) -> None:
    settings = get_settings()
    token = jwt.encode(
        {
            "sub": "unknown-subject-xyz",
            "iat": datetime.now(UTC),
            "exp": datetime.now(UTC) + timedelta(hours=1),
            "iss": "northcare-development",
        },
        settings.dev_auth_secret,
        algorithm="HS256",
    )
    resp = await api_client.get(
        "/v1/sync/changes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "ACCOUNT_INACTIVE"


@pytest.mark.asyncio
async def test_inactive_account_rejected(api_client: AsyncClient) -> None:
    settings = get_settings()
    token = jwt.encode(
        {
            "sub": "dev-worker-inactive",
            "iat": datetime.now(UTC),
            "exp": datetime.now(UTC) + timedelta(hours=1),
            "iss": "northcare-development",
        },
        settings.dev_auth_secret,
        algorithm="HS256",
    )
    resp = await api_client.get(
        "/v1/sync/changes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "ACCOUNT_INACTIVE"


@pytest.mark.asyncio
async def test_wrong_organisation_payload_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op(payload=client_payload(organisationId="org-other-999"))
    resp = await push(api_client, headers, device_id, [op])
    assert resp.json()["results"][0]["status"] == "rejected"
    assert resp.json()["results"][0]["errorCode"] == "SCOPE_VIOLATION"


@pytest.mark.asyncio
async def test_wrong_facility_payload_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op(payload=client_payload(facilityId="fac-dev-hq"))
    resp = await push(api_client, headers, device_id, [op])
    assert resp.json()["results"][0]["status"] == "rejected"
    assert resp.json()["results"][0]["errorCode"] == "SCOPE_VIOLATION"


@pytest.mark.asyncio
async def test_client_supplied_role_ignored_on_token_issue(api_client: AsyncClient) -> None:
    resp = await api_client.post(
        "/v1/development/auth/token",
        json={
            "account_id": "dev-worker-001",
            "password": "WorkerDemo1!",
            "role": "administrator",
        },
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    claims = jwt.decode(
        token,
        get_settings().dev_auth_secret,
        algorithms=["HS256"],
        options={"require": ["sub", "exp"]},
    )
    assert "role" not in claims


@pytest.mark.asyncio
async def test_uuid_guessing_provides_no_access(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    guessed = str(uuid.uuid4())
    resp = await api_client.post(
        f"/v1/sync/conflicts/{guessed}/resolve",
        headers=headers,
        json={"action": "chooseServer"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_revoked_device_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    async with SessionLocal() as session:
        await session.execute(
            update(RegisteredDevice)
            .where(RegisteredDevice.id == device_id)
            .values(account_id="dev-admin-001")
        )
        await session.commit()
    op = make_op()
    resp = await push(api_client, headers, device_id, [op])
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "DEVICE_NOT_REGISTERED"


@pytest.mark.asyncio
async def test_cross_facility_pull_filtering(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        await seed_synthetic(session)
        other = await session.get(ServerAccount, "dev-worker-fac2")
        if other is None:
            session.add(
                ServerAccount(
                    id="dev-worker-fac2",
                    remote_subject="dev-worker-fac2",
                    display_name="Synthetic Worker Facility 2",
                    role="worker",
                    organisation_id="org-dev-001",
                    facility_id="fac-dev-hq",
                    is_active=True,
                )
            )
            await session.commit()

    worker_headers = await auth_headers(api_client)
    worker_device = await register_device(api_client, worker_headers)
    entity_id = str(uuid.uuid4())
    op = make_op(entity_id=entity_id)
    assert (await push(api_client, worker_headers, worker_device, [op])).json()["results"][0][
        "status"
    ] == "acked"

    # Issue token for facility-2 worker via direct JWT (no password seed entry).
    settings = get_settings()
    token = jwt.encode(
        {
            "sub": "dev-worker-fac2",
            "iat": datetime.now(UTC),
            "exp": datetime.now(UTC) + timedelta(hours=1),
            "iss": "northcare-development",
        },
        settings.dev_auth_secret,
        algorithm="HS256",
    )
    other_headers = {"Authorization": f"Bearer {token}"}
    pull = await api_client.get(
        "/v1/sync/changes",
        headers=other_headers,
        params={"limit": 500},
    )
    assert pull.status_code == 200
    leaked = [c for c in pull.json()["changes"] if c["entityId"] == entity_id]
    assert leaked == []
