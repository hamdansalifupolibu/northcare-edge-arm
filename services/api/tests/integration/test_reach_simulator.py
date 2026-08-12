"""Reach R3 USSD simulator route gating and static-asset audits."""

from __future__ import annotations

from pathlib import Path

import pytest
from httpx import AsyncClient

from northcare_api.config import Settings
from tests.helpers_reach import (
    create_payload,
    disable_reach_demo,
    enable_reach_demo,
)

ROOT = Path(__file__).resolve().parents[4]
STATIC_DIR = ROOT / "services" / "api" / "static" / "reach-simulator"


@pytest.fixture(autouse=True)
def _reset_gate() -> None:
    disable_reach_demo()
    yield
    disable_reach_demo()


def _read_static(name: str) -> str:
    return (STATIC_DIR / name).read_text(encoding="utf-8")


def test_static_simulator_files_exist() -> None:
    for name in ("index.html", "reach.css", "reach.js"):
        assert (STATIC_DIR / name).is_file(), name


def test_static_content_contains_required_labels() -> None:
    html = _read_static("index.html")
    js = _read_static("reach.js")
    combined = html + "\n" + js
    assert "NorthCare Reach USSD simulation" in combined
    assert "Live telecom integration pending" in combined
    assert "Synthetic demonstration data only" in combined
    assert "0. Emergency help now" in js
    assert "1. Pregnancy and newborn care" in js
    assert "2. Child health" in js
    assert "3. Nutrition" in js
    assert "4. Request a CHPS worker" in js
    assert "5. Check a request or follow-up" in js
    assert "6. Language" in js
    assert "call 112 now" in js.lower() or "Call 112" in js
    assert "Emergency coordination simulation" in js
    assert "Demonstration information only" in js
    assert "Approved public health content pending" in js


def test_static_content_forbids_ambulance_and_storage() -> None:
    js = _read_static("reach.js")
    html = _read_static("index.html")
    css = _read_static("reach.css")
    combined = f"{html}\n{css}\n{js}".lower()
    for forbidden in (
        "ambulance dispatched",
        "ambulance called",
        "emergency medically confirmed",
        "severe emergency",
        "major emergency",
        "moderate emergency",
    ):
        assert forbidden not in combined, forbidden
    assert "localstorage" not in combined
    assert "sessionstorage" not in combined
    assert "indexeddb" not in combined
    assert "document.cookie" not in combined


def test_static_has_no_external_scripts_or_eval() -> None:
    html = _read_static("index.html")
    js = _read_static("reach.js")
    assert 'src="http' not in html.lower()
    assert "cdn." not in html.lower()
    assert "googletagmanager" not in html.lower()
    assert "analytics" not in html.lower()
    assert "eval(" not in js
    assert "innerHTML" not in js


def test_static_js_uses_same_origin_r2_paths() -> None:
    js = _read_static("reach.js")
    assert '/v1/reach/requests"' in js or "/v1/reach/requests'" in js
    assert "/v1/reach/requests/status" in js
    assert "AbortController" in js
    assert "createReachRequest" in js
    assert "checkReachRequestStatus" in js
    assert "ussdSimulator" in js
    assert 'preferredLanguage = "en"' in js or "PREFERRED_LANGUAGE = \"en\"" in js


def test_static_accessibility_hooks_present() -> None:
    html = _read_static("index.html")
    assert 'aria-live="polite"' in html
    assert 'for="ussd-input"' in html
    assert 'id="btn-send"' in html
    assert 'id="btn-back"' in html
    assert 'id="btn-restart"' in html


@pytest.mark.asyncio
async def test_simulator_unavailable_when_gate_disabled(api_client: AsyncClient) -> None:
    response = await api_client.get("/reach-simulator")
    assert response.status_code == 403
    body = response.json()
    assert body.get("detail", {}).get("code") == "reachDemoDisabled"


@pytest.mark.asyncio
async def test_simulator_assets_unavailable_when_gate_disabled(api_client: AsyncClient) -> None:
    for path in (
        "/reach-simulator/",
        "/reach-simulator/reach.css",
        "/reach-simulator/reach.js",
        "/reach-simulator/index.html",
    ):
        response = await api_client.get(path)
        assert response.status_code == 403, path


@pytest.mark.asyncio
async def test_simulator_available_when_gate_enabled(api_client: AsyncClient) -> None:
    enable_reach_demo()
    index = await api_client.get("/reach-simulator")
    assert index.status_code == 200
    assert "text/html" in index.headers.get("content-type", "")
    text = index.text
    assert "NorthCare Reach USSD simulation" in text
    assert "Live telecom integration pending" in text
    assert index.headers.get("content-security-policy")
    assert index.headers.get("x-content-type-options") == "nosniff"

    css = await api_client.get("/reach-simulator/reach.css")
    assert css.status_code == 200
    assert "text/css" in css.headers.get("content-type", "")

    js = await api_client.get("/reach-simulator/reach.js")
    assert js.status_code == 200
    assert "javascript" in js.headers.get("content-type", "")
    assert "createReachRequest" in js.text


@pytest.mark.asyncio
async def test_simulator_rejects_unknown_asset(api_client: AsyncClient) -> None:
    enable_reach_demo()
    response = await api_client.get("/reach-simulator/secret.env")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_simulator_does_not_directory_list(api_client: AsyncClient) -> None:
    enable_reach_demo()
    # Traversal / unexpected names must 404; no listing page.
    response = await api_client.get("/reach-simulator/../config.py")
    assert response.status_code in {404, 403, 400}


def test_simulator_cannot_enable_in_staging_or_production() -> None:
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="staging", NORTHCARE_REACH_DEMO_ENABLED=True)
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="production", NORTHCARE_REACH_DEMO_ENABLED=True)


@pytest.mark.asyncio
async def test_simulator_create_and_status_via_r2_api(api_client: AsyncClient) -> None:
    enable_reach_demo()
    create = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="pregnancyNewborn", requestType="routine"),
    )
    assert create.status_code == 200
    payload = create.json()
    reference = payload["referenceCode"]
    pin = payload["statusPin"]
    assert reference.startswith("NCR-")
    assert isinstance(pin, str) and len(pin) == 6

    status = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": pin},
    )
    assert status.status_code == 200
    body = status.json()
    assert set(body.keys()) == {"publicStatusLabel"}
    assert body["publicStatusLabel"] in {
        "Request received",
        "Waiting for review",
        "Health worker acknowledged",
        "Contact attempt recorded",
        "Escalated for further support",
        "Request handled",
        "Request cancelled",
    }
