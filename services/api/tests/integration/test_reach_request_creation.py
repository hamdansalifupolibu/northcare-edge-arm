from __future__ import annotations

import pytest
from httpx import AsyncClient

from northcare_api.config import Settings
from tests.helpers_reach import create_payload, disable_reach_demo, enable_reach_demo


@pytest.fixture(autouse=True)
def _reach_gate() -> None:
    enable_reach_demo()
    yield
    disable_reach_demo()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("category", "request_type"),
    [
        ("pregnancyNewborn", "routine"),
        ("childHealth", "routine"),
        ("nutrition", "routine"),
        ("generalChps", "routine"),
        ("referralFollowUp", "routine"),
        ("emergency", "emergencyAssistance"),
        ("emergency", "urgentContact"),
    ],
)
async def test_create_valid_categories(
    api_client: AsyncClient, category: str, request_type: str
) -> None:
    resp = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category=category, requestType=request_type),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "referenceCode" in body
    assert "statusPin" in body
    assert len(body["statusPin"]) == 6
    assert body["publicMessage"] == "Request received"
    assert "assignedWorkerId" not in body
    assert "statusPinHash" not in body
    if category == "emergency":
        assert body.get("simulationNotice")
        assert "112" in (body.get("emergencyReminder") or "")


@pytest.mark.asyncio
async def test_rejects_unsupported_category_and_type(api_client: AsyncClient) -> None:
    bad_cat = await api_client.post(
        "/v1/reach/requests", json=create_payload(category="malaria")
    )
    assert bad_cat.status_code == 422
    bad_type = await api_client.post(
        "/v1/reach/requests", json=create_payload(requestType="critical")
    )
    assert bad_type.status_code == 422


@pytest.mark.asyncio
async def test_rejects_invalid_category_type_combination(api_client: AsyncClient) -> None:
    resp = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="pregnancyNewborn", requestType="emergencyAssistance"),
    )
    assert resp.status_code == 422
    emergency_routine = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="emergency", requestType="routine"),
    )
    assert emergency_routine.status_code == 422


@pytest.mark.asyncio
async def test_rejects_unknown_fields_and_symptoms(api_client: AsyncClient) -> None:
    payload = create_payload()
    payload["detailedSymptoms"] = "fever"
    payload["facilityId"] = "fac-other"
    resp = await api_client.post("/v1/reach/requests", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_contact_and_landmark_validation(api_client: AsyncClient) -> None:
    short = await api_client.post(
        "/v1/reach/requests", json=create_payload(contactNumber="123")
    )
    assert short.status_code == 422
    long_landmark = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(communityOrLandmark="x" * 201),
    )
    assert long_landmark.status_code == 422


@pytest.mark.asyncio
async def test_consent_validation(api_client: AsyncClient) -> None:
    no_contact = await api_client.post(
        "/v1/reach/requests", json=create_payload(consentToContact=False)
    )
    assert no_contact.status_code == 422
    emergency = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(
            category="emergency",
            requestType="emergencyAssistance",
            consentToShareLocation=False,
        ),
    )
    assert emergency.status_code == 422


@pytest.mark.asyncio
async def test_client_controlled_server_fields_ignored_via_forbid(
    api_client: AsyncClient,
) -> None:
    payload = create_payload()
    payload["organisationId"] = "org-evil"
    payload["facilityId"] = "fac-evil"
    payload["assignedWorkerId"] = "worker-evil"
    payload["status"] = "handled"
    payload["version"] = 99
    resp = await api_client.post("/v1/reach/requests", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_development_gate_disabled(api_client: AsyncClient) -> None:
    disable_reach_demo()
    resp = await api_client.post("/v1/reach/requests", json=create_payload())
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "reachDemoDisabled"
    enable_reach_demo()


def test_reach_gate_rejected_in_staging_and_production() -> None:
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="staging", NORTHCARE_REACH_DEMO_ENABLED=True)
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="production", NORTHCARE_REACH_DEMO_ENABLED=True)
    assert Settings(NORTHCARE_ENV="development", NORTHCARE_REACH_DEMO_ENABLED=False).reach_demo_enabled is False
    defaulted = Settings(NORTHCARE_ENV="development", NORTHCARE_REACH_DEMO_ENABLED=False)
    assert defaulted.northcare_reach_demo_enabled is False
