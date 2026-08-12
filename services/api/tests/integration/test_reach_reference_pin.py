from __future__ import annotations

import re

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from northcare_api.database import SessionLocal
from northcare_api.domain.models import AdministrationAuditEvent, CommunityRequest
from northcare_api.reach.reference import generate_reference_code, is_valid_reference_format
from northcare_api.reach.status_pin import generate_status_pin, hash_status_pin, verify_status_pin
from tests.helpers_reach import create_payload, disable_reach_demo, enable_reach_demo


@pytest.fixture(autouse=True)
def _reach_gate() -> None:
    enable_reach_demo()
    yield
    disable_reach_demo()


def test_reference_format_and_non_sequential() -> None:
    codes = [generate_reference_code() for _ in range(20)]
    assert all(is_valid_reference_format(code) for code in codes)
    assert len(set(codes)) == len(codes)
    assert not any(code.endswith("00000001") for code in codes)
    assert not any("233" in code for code in codes)


def test_status_pin_leading_zero_and_verifier() -> None:
    # Force leading-zero coverage via hash/verify of a known zero-padded value.
    pin = "000042"
    hashed = hash_status_pin(pin)
    assert hashed.startswith("$argon2")
    assert verify_status_pin(pin, hashed) is True
    assert verify_status_pin("000043", hashed) is False
    sample = generate_status_pin()
    assert re.fullmatch(r"\d{6}", sample)


@pytest.mark.asyncio
async def test_create_returns_pin_once_and_stores_hash_only(api_client: AsyncClient) -> None:
    resp = await api_client.post("/v1/reach/requests", json=create_payload())
    assert resp.status_code == 200
    body = resp.json()
    reference = body["referenceCode"]
    pin = body["statusPin"]
    assert re.fullmatch(r"\d{6}", pin)
    assert pin not in resp.text.replace(f'"statusPin":"{pin}"', "")

    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        assert pin not in row.status_pin_hash
        assert row.status_pin_hash.startswith("$argon2")
        assert verify_status_pin(pin, row.status_pin_hash)
        audits = (
            await session.execute(
                select(AdministrationAuditEvent).where(
                    AdministrationAuditEvent.event_type == "community_request_created"
                )
            )
        ).scalars().all()
        for event in audits:
            dumped = str(event.safe_metadata)
            assert pin not in dumped
            assert "statusPin" not in dumped
            assert "contactNumber" not in dumped


@pytest.mark.asyncio
async def test_public_status_lookup_generic_and_lockout(api_client: AsyncClient) -> None:
    created = await api_client.post("/v1/reach/requests", json=create_payload())
    body = created.json()
    reference = body["referenceCode"]
    pin = body["statusPin"]

    ok = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": pin},
    )
    assert ok.status_code == 200
    assert set(ok.json().keys()) == {"publicStatusLabel"}
    assert ok.json()["publicStatusLabel"] in {
        "Request received",
        "Waiting for review",
    }

    wrong = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": "999999"},
    )
    assert wrong.status_code == 404
    assert wrong.json()["detail"]["code"] == "statusLookupFailed"

    missing = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": "NCR-ZZZZZZZZ", "statusPin": "123456"},
    )
    assert missing.status_code == 404
    assert missing.json()["detail"]["code"] == "statusLookupFailed"

    for _ in range(5):
        await api_client.post(
            "/v1/reach/requests/status",
            json={"referenceCode": reference, "statusPin": "111111"},
        )
    locked = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": pin},
    )
    assert locked.status_code == 429
    assert "remaining" not in locked.text.lower()
