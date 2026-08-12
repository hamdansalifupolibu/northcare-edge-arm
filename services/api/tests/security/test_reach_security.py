from __future__ import annotations

import pytest
from httpx import AsyncClient

from northcare_api.config import Settings
from tests.helpers_reach import create_payload, disable_reach_demo, enable_reach_demo


@pytest.fixture(autouse=True)
def _reset_gate() -> None:
    disable_reach_demo()
    yield
    disable_reach_demo()


def test_reach_disabled_by_default() -> None:
    settings = Settings(
        NORTHCARE_ENV="development",
        NORTHCARE_REACH_DEMO_ENABLED=False,
    )
    assert settings.reach_demo_enabled is False


def test_reach_cannot_enable_in_staging_or_production() -> None:
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="staging", NORTHCARE_REACH_DEMO_ENABLED=True)
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="production", NORTHCARE_REACH_DEMO_ENABLED=True)


@pytest.mark.asyncio
async def test_public_endpoints_unavailable_when_disabled(api_client: AsyncClient) -> None:
    create = await api_client.post("/v1/reach/requests", json=create_payload())
    assert create.status_code == 403
    status = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": "NCR-ABCDEFGH", "statusPin": "123456"},
    )
    assert status.status_code == 403


@pytest.mark.asyncio
async def test_reference_pin_not_accepted_via_query_string(api_client: AsyncClient) -> None:
    enable_reach_demo()
    # Status lookup is POST-only; GET with query must not succeed as lookup.
    get_resp = await api_client.get(
        "/v1/reach/requests/status",
        params={"referenceCode": "NCR-ABCDEFGH", "statusPin": "123456"},
    )
    assert get_resp.status_code in {404, 405, 422}
