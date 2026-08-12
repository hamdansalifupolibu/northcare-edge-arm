"""Unit tests for Reach USSD Ask NorthCare (FAQ-only menu 7)."""

from __future__ import annotations

from northcare_api.reach.ussd_at.ask_faq import (
    ANSWER_DISCLAIMER,
    EMERGENCY_ESCALATION,
    match_faq,
)
from northcare_api.reach.ussd_at.menus import apply_input, continue_menu, screen_text
from northcare_api.reach.ussd_at.session_store import AtUssdSession


def _session() -> AtUssdSession:
    return AtUssdSession(session_id="ask-test", service_code="*384*100#")


def test_main_menu_includes_ask_northcare() -> None:
    session = _session()
    menu = continue_menu(session)
    assert menu.reply is not None
    assert "7. Ask NorthCare" in menu.reply.message


def test_menu_7_opens_ask_shortcuts() -> None:
    session = _session()
    result = apply_input(session, "7")
    assert result.reply is not None
    assert result.reply.continue_session is True
    assert session.screen == "askNorthCareMenu"
    assert "Information support" in result.reply.message
    assert "not clinical advice" in result.reply.message.lower()
    assert "1. What is NorthCare Reach?" in result.reply.message


def test_faq_what_is_reach_includes_disclaimer() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "1")
    assert session.screen == "askFaqAnswer"
    assert result.reply is not None
    assert "community information support" in result.reply.message.lower() or "NorthCare Reach" in result.reply.message
    assert "Not a diagnosis" in result.reply.message
    assert "112" in result.reply.message
    assert ANSWER_DISCLAIMER.split("\n")[0] in result.reply.message


def test_faq_status_pin_path() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "3")
    assert result.reply is not None
    assert "six-digit" in result.reply.message.lower() or "status PIN" in result.reply.message
    assert "Not a diagnosis" in result.reply.message


def test_faq_hours_path() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "4")
    assert result.reply is not None
    assert "vary" in result.reply.message.lower()
    assert "Not a diagnosis" in result.reply.message


def test_emergency_faq_escalation_copy_and_end_112() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "5")
    assert session.screen == "askFaqAnswer"
    assert result.reply is not None
    assert "112" in result.reply.message
    assert "NorthCare has not placed the call" in result.reply.message
    assert "dial 112" in result.reply.message.lower() or "call 112" in result.reply.message.lower()

    end_112 = apply_input(session, "1")
    assert end_112.reply is not None
    assert end_112.reply.continue_session is False
    assert end_112.end_session_drop is True
    assert "112" in end_112.reply.message
    assert end_112.create_request is False


def test_emergency_faq_urgent_callback_starts_create_flow() -> None:
    session = _session()
    apply_input(session, "7")
    apply_input(session, "5")
    result = apply_input(session, "2")
    assert result.create_request is False
    assert session.screen == "locationInput"
    assert session.category == "emergency"
    assert session.request_type == "urgentContact"


def test_request_worker_followup_uses_general_chps() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "6")
    assert result.reply is not None
    assert session.screen == "locationInput"
    assert session.category == "generalChps"
    assert session.request_type == "routine"
    assert result.create_request is False  # consent not yet given


def test_faq_answer_worker_followup_option() -> None:
    session = _session()
    apply_input(session, "7")
    apply_input(session, "2")
    result = apply_input(session, "1")
    assert session.category == "generalChps"
    assert session.request_type == "routine"
    assert session.screen == "locationInput"
    assert result.create_request is False


def test_free_text_matches_faq_without_creating_request() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "how does my status pin work")
    assert result.create_request is False
    assert session.screen == "askFaqAnswer"
    assert result.reply is not None
    assert "PIN" in result.reply.message or "pin" in result.reply.message.lower()
    assert "Not a diagnosis" in result.reply.message


def test_free_text_emergency_keywords_escalate() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "this is an emergency call 112")
    assert session.screen == "askFaqAnswer"
    assert result.reply is not None
    assert "112" in result.reply.message
    assert result.create_request is False


def test_free_text_no_match_offers_handoff() -> None:
    session = _session()
    apply_input(session, "7")
    result = apply_input(session, "zzz unrelated potato gardening tips")
    assert session.screen == "askNoMatch"
    assert result.reply is not None
    assert "No matching approved answer" in result.reply.message
    assert "does not diagnose" in result.reply.message.lower()
    assert "Request worker follow-up" in result.reply.message
    assert result.create_request is False

    handoff = apply_input(session, "1")
    assert session.category == "generalChps"
    assert session.screen == "locationInput"
    assert handoff.create_request is False


def test_match_faq_helpers() -> None:
    assert match_faq("What is NorthCare Reach?").key == "what_is_reach"
    assert match_faq("how do I request a CHPS visit").key == "request_chps"
    assert match_faq("immediate danger").key == "emergency_112"
    assert match_faq("xyzzy") is None


def test_screen_text_ask_faq_answer_fallback() -> None:
    session = _session()
    session.screen = "askFaqAnswer"
    session.ask_faq_key = None
    text = screen_text(session)
    assert "No matching approved answer" in text


def test_emergency_escalation_constant_has_required_copy() -> None:
    assert "112" in EMERGENCY_ESCALATION
    assert "NorthCare has not placed the call" in EMERGENCY_ESCALATION
    assert "Not a diagnosis" in EMERGENCY_ESCALATION
