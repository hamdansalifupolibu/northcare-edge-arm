"""Unit tests for Africa's Talking USSD adapter (Reach T1)."""

from __future__ import annotations

import pytest

from northcare_api.config import Settings, get_settings
from northcare_api.reach.ussd_at.adapter import (
    AtUssdGateError,
    assert_service_code_allowed,
    normalize_service_code,
    parse_at_form,
    require_at_ussd_sandbox,
    verify_callback_secret,
)
from northcare_api.reach.ussd_at.response import at_plain_text_response
from northcare_api.reach.ussd_at.menus import (
    apply_input,
    continue_menu,
    format_create_success,
    screen_text,
    split_at_text,
)
from northcare_api.reach.ussd_at.redaction import mask_phone, mask_session_id
from northcare_api.reach.ussd_at.response import con, end
from northcare_api.reach.ussd_at.session_store import SESSION_STORE, AtUssdSession


@pytest.fixture(autouse=True)
def _clear_sessions() -> None:
    SESSION_STORE.clear()
    yield
    SESSION_STORE.clear()


def test_con_end_builders() -> None:
    assert con("Hello").to_plain_text() == "CON Hello"
    assert end("Bye").to_plain_text() == "END Bye"
    success = format_create_success(
        reference_code="NCR-ABCD2345",
        status_pin="123456",
        is_emergency=False,
    )
    assert success.to_plain_text().startswith("END ")
    assert "123456" in success.to_plain_text()


def test_split_at_text() -> None:
    assert split_at_text("") == []
    assert split_at_text(None) == []
    assert split_at_text("4") == ["4"]
    assert split_at_text("4*5*Tolon Station") == ["4", "5", "Tolon Station"]


def test_mask_phone_and_session() -> None:
    assert mask_phone("+233200000099") == "***99"
    assert "233200000099" not in mask_phone("+233200000099")
    assert mask_phone("") == "<empty>"
    assert "abcdef" not in mask_session_id("abcdefghijklmnop")


def test_parse_at_form_required_fields() -> None:
    parsed = parse_at_form(
        {
            "sessionId": "ATUid_test_001",
            "phoneNumber": "+233200000001",
            "networkCode": "62002",
            "serviceCode": "*384*100#",
            "text": "1*2",
        }
    )
    assert parsed["sessionId"] == "ATUid_test_001"
    assert parsed["text"] == "1*2"
    with pytest.raises(AtUssdGateError) as exc:
        parse_at_form({"sessionId": "x"})
    assert exc.value.code == "atUssdInvalidPayload"


def test_main_menu_and_emergency_112_end() -> None:
    session = AtUssdSession(session_id="s1", service_code="*384*100#")
    menu = continue_menu(session)
    assert menu.reply is not None
    assert menu.reply.continue_session is True
    assert "NORTHCARE REACH" in menu.reply.message
    assert "AT sandbox" in menu.reply.message

    result = apply_input(session, "0")
    assert result.reply is not None and result.reply.continue_session
    assert session.screen == "emergencyMenu"

    end_112 = apply_input(session, "1")
    assert end_112.reply is not None
    assert end_112.reply.continue_session is False
    assert "112" in end_112.reply.message
    assert end_112.create_request is False


def test_chps_request_nav_to_consent() -> None:
    session = AtUssdSession(session_id="s2", service_code="*384*100#")
    for segment in ["4", "5", "Synthetic Landmark", "+233200000011"]:
        result = apply_input(session, segment)
        assert result.reply is not None
        assert result.reply.continue_session is True
    assert session.screen == "consentInput"
    consent = apply_input(session, "1")
    assert consent.create_request is True
    assert session.category == "generalChps"
    assert session.request_type == "routine"


def test_gate_flags(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NORTHCARE_ENV", "test")
    monkeypatch.setenv("NORTHCARE_REACH_DEMO_ENABLED", "true")
    monkeypatch.setenv("NORTHCARE_REACH_AT_USSD_ENABLED", "false")
    monkeypatch.setenv("NORTHCARE_REACH_AT_USSD_MODE", "sandbox")
    monkeypatch.setenv("NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET", "secret-test-value")
    monkeypatch.setenv("NORTHCARE_REACH_AT_USSD_SERVICE_CODES", "*384*100#")
    get_settings.cache_clear()
    settings = get_settings()
    with pytest.raises(AtUssdGateError) as exc:
        require_at_ussd_sandbox(settings)
    assert exc.value.code == "atUssdDisabled"

    monkeypatch.setenv("NORTHCARE_REACH_AT_USSD_ENABLED", "true")
    get_settings.cache_clear()
    settings = get_settings()
    require_at_ussd_sandbox(settings)
    verify_callback_secret(settings, "secret-test-value")
    with pytest.raises(AtUssdGateError):
        verify_callback_secret(settings, "wrong")
    assert_service_code_allowed(settings, "*384*100#")
    assert_service_code_allowed(settings, "*384*100")  # AT may omit trailing #
    assert normalize_service_code("*384*100#") == "*384*100"
    with pytest.raises(AtUssdGateError) as bad_code:
        assert_service_code_allowed(settings, "*999#")
    assert bad_code.value.code == "atUssdServiceCodeRejected"


def test_at_plain_text_response_content_type() -> None:
    resp = at_plain_text_response("CON Hello")
    assert resp.headers["content-type"] == "text/plain"
    assert "charset" not in resp.headers["content-type"]


def test_live_mode_rejected_at_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NORTHCARE_ENV", "test")
    monkeypatch.setenv("NORTHCARE_REACH_AT_USSD_MODE", "live")
    get_settings.cache_clear()
    with pytest.raises(ValueError, match="live is not available"):
        Settings()


def test_database_url_rewrites_render_style_postgres() -> None:
    assert (
        Settings(
            DATABASE_URL="postgresql://user:pass@host:5432/northcare"
        ).database_url
        == "postgresql+asyncpg://user:pass@host:5432/northcare"
    )
    assert (
        Settings(DATABASE_URL="postgres://user:pass@host/db").database_url
        == "postgresql+asyncpg://user:pass@host/db"
    )
    unchanged = "postgresql+asyncpg://user:pass@host/db"
    assert Settings(DATABASE_URL=unchanged).database_url == unchanged
    assert (
        Settings(
            DATABASE_URL=(
                "postgresql://user:pass@host.example/db?sslmode=require"
            )
        ).database_url
        == "postgresql+asyncpg://user:pass@host.example/db?ssl=true"
    )


def test_screen_text_no_ambulance_claims() -> None:
    session = AtUssdSession(session_id="s3", service_code="*384*100#")
    session.screen = "emergencyMenu"
    text = screen_text(session).lower()
    assert "ambulance" not in text
    assert "112" in text
