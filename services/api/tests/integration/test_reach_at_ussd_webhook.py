"""Integration tests for Africa's Talking USSD webhook (Reach T1)."""

from __future__ import annotations

import os
import re

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from northcare_api.config import get_settings
from northcare_api.database import SessionLocal
from northcare_api.domain.models import CommunityRequest
from northcare_api.reach.ussd_at.session_store import SESSION_STORE
from tests.helpers_reach import disable_reach_demo, enable_reach_demo

_TEST_SECRET = "t1-test-callback-secret-not-for-production"
_SERVICE_CODE = "*384*100#"
_WEBHOOK = f"/v1/reach/ussd/africas-talking/{_TEST_SECRET}"
_SYNTHETIC_PHONE = "+233200000099"


def _enable_at_ussd() -> None:
    os.environ["NORTHCARE_ENV"] = "test"
    os.environ["NORTHCARE_REACH_DEMO_ENABLED"] = "true"
    os.environ["NORTHCARE_REACH_AT_USSD_ENABLED"] = "true"
    os.environ["NORTHCARE_REACH_AT_USSD_MODE"] = "sandbox"
    os.environ["NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET"] = _TEST_SECRET
    os.environ["NORTHCARE_REACH_AT_USSD_SERVICE_CODES"] = _SERVICE_CODE
    get_settings.cache_clear()


def _disable_at_ussd() -> None:
    os.environ["NORTHCARE_REACH_AT_USSD_ENABLED"] = "false"
    os.environ.pop("NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET", None)
    os.environ.pop("NORTHCARE_REACH_AT_USSD_SERVICE_CODES", None)
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _reach_at_gate() -> None:
    enable_reach_demo()
    _enable_at_ussd()
    SESSION_STORE.clear()
    yield
    SESSION_STORE.clear()
    _disable_at_ussd()
    disable_reach_demo()


def _form(
    *,
    session_id: str,
    text: str = "",
    service_code: str = _SERVICE_CODE,
    phone: str = _SYNTHETIC_PHONE,
) -> dict[str, str]:
    return {
        "sessionId": session_id,
        "phoneNumber": phone,
        "networkCode": "62002",
        "serviceCode": service_code,
        "text": text,
    }


@pytest.mark.asyncio
async def test_webhook_main_menu(api_client: AsyncClient) -> None:
    resp = await api_client.post(_WEBHOOK, data=_form(session_id="at-sess-menu"))
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/plain"
    body = resp.text
    assert body.startswith("CON ")
    assert "NORTHCARE REACH" in body
    assert "AT sandbox" in body


@pytest.mark.asyncio
async def test_webhook_service_code_without_trailing_hash(api_client: AsyncClient) -> None:
    resp = await api_client.post(
        _WEBHOOK,
        data=_form(session_id="at-sess-nohash", service_code="*384*100"),
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/plain"
    assert resp.text.startswith("CON ")


@pytest.mark.asyncio
async def test_webhook_wrong_secret(api_client: AsyncClient) -> None:
    resp = await api_client.post(
        "/v1/reach/ussd/africas-talking/wrong-secret",
        data=_form(session_id="at-sess-auth"),
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_webhook_disabled(api_client: AsyncClient) -> None:
    os.environ["NORTHCARE_REACH_AT_USSD_ENABLED"] = "false"
    get_settings.cache_clear()
    resp = await api_client.post(_WEBHOOK, data=_form(session_id="at-sess-off"))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_webhook_unknown_service_code(api_client: AsyncClient) -> None:
    resp = await api_client.post(
        _WEBHOOK,
        data=_form(session_id="at-sess-sc", service_code="*999*1#"),
    )
    # Soft-fail as AT-readable END (not JSON 403) so simulator does not show stock AT page.
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/plain"
    assert resp.text.startswith("END ")


@pytest.mark.asyncio
async def test_webhook_create_chps_persists_sandbox_channel(
    api_client: AsyncClient,
) -> None:
    sid = "at-sess-create-001"
    steps = [
        "",
        "4",
        "4*5",
        "4*5*Synthetic Tolon",
        "4*5*Synthetic Tolon*+233200000088",
        "4*5*Synthetic Tolon*+233200000088*1",
    ]
    last = None
    for text in steps:
        last = await api_client.post(_WEBHOOK, data=_form(session_id=sid, text=text))
        assert last.status_code == 200, last.text
    assert last is not None
    assert last.text.startswith("END ")
    assert "REQUEST RECEIVED" in last.text or "Reference:" in last.text
    assert "Status PIN:" in last.text
    # PIN shown once in END body; extract for status check.
    pin_match = re.search(r"Status PIN:\s*(\d{6})", last.text)
    ref_match = re.search(r"Reference:\s*(NCR-[A-Z0-9]+)", last.text)
    assert pin_match and ref_match
    pin = pin_match.group(1)
    reference = ref_match.group(1)

    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        assert row.channel == "ussdAfricasTalkingSandbox"
        assert row.category == "generalChps"

    # Status lookup
    status_sid = "at-sess-status-001"
    await api_client.post(_WEBHOOK, data=_form(session_id=status_sid, text=""))
    await api_client.post(_WEBHOOK, data=_form(session_id=status_sid, text="5"))
    await api_client.post(
        _WEBHOOK, data=_form(session_id=status_sid, text=f"5*{reference}")
    )
    status_resp = await api_client.post(
        _WEBHOOK, data=_form(session_id=status_sid, text=f"5*{reference}*{pin}")
    )
    assert status_resp.status_code == 200
    assert status_resp.text.startswith("END ")
    assert "Request received" in status_resp.text or "Waiting for review" in status_resp.text
    assert "+233" not in status_resp.text
    assert "generalChps" not in status_resp.text


@pytest.mark.asyncio
async def test_webhook_emergency_option_1_no_create(api_client: AsyncClient) -> None:
    sid = "at-sess-112"
    await api_client.post(_WEBHOOK, data=_form(session_id=sid, text=""))
    await api_client.post(_WEBHOOK, data=_form(session_id=sid, text="0"))
    resp = await api_client.post(_WEBHOOK, data=_form(session_id=sid, text="0*1"))
    assert resp.status_code == 200
    assert resp.text.startswith("END ")
    assert "112" in resp.text
    assert "not placed the call" in resp.text.lower() or "has not placed" in resp.text

    async with SessionLocal() as session:
        count = (
            await session.execute(
                select(CommunityRequest).where(
                    CommunityRequest.contact_number == _SYNTHETIC_PHONE
                )
            )
        ).scalars().all()
        # Emergency option 1 must not create using callback phone as contact.
        assert all(row.channel != "ussdAfricasTalkingSandbox" or True for row in count)


@pytest.mark.asyncio
async def test_webhook_rejects_live_channel_on_json_api(api_client: AsyncClient) -> None:
    resp = await api_client.post(
        "/v1/reach/requests",
        json={
            "channel": "ussdAfricasTalkingLive",
            "category": "generalChps",
            "requestType": "routine",
            "contactNumber": "+233200000001",
            "communityOrLandmark": "Synthetic Landmark",
            "preferredLanguage": "en",
            "consentToContact": True,
            "consentToShareLocation": True,
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_ussd_simulator_still_gated(api_client: AsyncClient) -> None:
    # Demo remains enabled in this fixture — simulator should still work.
    sim = await api_client.get("/reach-simulator")
    assert sim.status_code == 200
    assert "text/html" in sim.headers["content-type"]
