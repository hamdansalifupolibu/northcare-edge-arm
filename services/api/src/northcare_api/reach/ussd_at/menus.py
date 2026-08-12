"""NorthCare Reach USSD menu screens and navigation for Africa's Talking sandbox."""

from __future__ import annotations

import re
from dataclasses import dataclass

from northcare_api.reach.ussd_at.ask_faq import (
    ASK_MENU_SHORTCUTS,
    FAQ_BY_CHOICE,
    FAQ_BY_KEY,
    NO_MATCH_MESSAGE,
    format_faq_answer_screen,
    match_faq,
)
from northcare_api.reach.ussd_at.response import UssdReply, con, end
from northcare_api.reach.ussd_at.session_store import AtUssdSession

CONTACT_PATTERN = re.compile(r"^\+?[0-9]{8,15}$")
PIN_PATTERN = re.compile(r"^\d{6}$")
REF_PREFIX = "NCR-"
REF_BODY_LEN = 8
REF_ALPHABET = set("23456789ABCDEFGHJKMNPQRSTUVWXYZ")

INVALID_CHOICE = "Please choose one of the listed options."
UNAVAILABLE = (
    "NorthCare Reach is unavailable in this sandbox right now.\nPlease try again."
)
GENERIC_LOOKUP_FAIL = (
    "Request could not be checked.\nCheck the reference and PIN, then try again."
)
DEMO_INFO = (
    "Demonstration information only\n"
    "Approved public health content pending\n\n"
    "This topic will provide professionally reviewed information in a future version.\n"
    "You may request a CHPS worker now.\n\n"
    "1. Request a CHPS worker\n"
    "9. Back"
)

# Free-text must not contain AT path separator.
_FORBIDDEN_STAR = "*"


@dataclass(frozen=True, slots=True)
class NavResult:
    """Result of applying one user input segment to the session."""

    reply: UssdReply | None = None
    create_request: bool = False
    status_lookup_pin: str | None = None
    end_session_drop: bool = False


def split_at_text(text: str | None) -> list[str]:
    if text is None:
        return []
    stripped = text.strip()
    if stripped == "":
        return []
    return stripped.split("*")


def is_valid_reference_format(value: str) -> bool:
    trimmed = value.strip().upper()
    if not trimmed.startswith(REF_PREFIX):
        return False
    body = trimmed[len(REF_PREFIX) :]
    if len(body) != REF_BODY_LEN:
        return False
    return all(ch in REF_ALPHABET for ch in body)


def screen_text(session: AtUssdSession) -> str:
    screen = session.screen
    if screen == "mainMenu":
        return (
            "NORTHCARE REACH\n"
            "AT sandbox - not a live Ghana shortcode\n\n"
            "0. Emergency help now\n"
            "1. Pregnancy and newborn care\n"
            "2. Child health\n"
            "3. Nutrition\n"
            "4. Request a CHPS worker\n"
            "5. Check a request or follow-up\n"
            "6. Language\n"
            "7. Ask NorthCare"
        )
    if screen == "emergencyMenu":
        return (
            "EMERGENCY HELP\n\n"
            "If someone is in immediate danger, call 112 now.\n\n"
            "1. End and call 112\n"
            "2. Send location for urgent human review\n"
            "3. Request an urgent CHPS callback\n"
            "9. Back"
        )
    if screen == "pregnancyMenu":
        return (
            "PREGNANCY & NEWBORN CARE\n\n"
            "1. Care during pregnancy\n"
            "2. Labour and warning signs\n"
            "3. Care after delivery\n"
            "4. Newborn care\n"
            "5. Breastfeeding\n"
            "6. Request a CHPS worker\n"
            "0. Emergency help\n"
            "9. Back"
        )
    if screen == "childHealthMenu":
        return (
            "CHILD HEALTH\n\n"
            "1. Fever\n"
            "2. Diarrhoea or vomiting\n"
            "3. Cough or breathing concern\n"
            "4. Poor feeding or weakness\n"
            "5. Immunisation and routine care\n"
            "6. Request a CHPS worker\n"
            "0. Emergency help\n"
            "9. Back"
        )
    if screen == "nutritionMenu":
        return (
            "NUTRITION SUPPORT\n\n"
            "1. Pregnant woman\n"
            "2. Breastfeeding mother\n"
            "3. Baby under 6 months\n"
            "4. Child 6 to 24 months\n"
            "5. Child 2 to 5 years\n"
            "6. Request nutrition support\n"
            "0. Emergency help\n"
            "9. Back"
        )
    if screen == "chpsReasonMenu":
        return (
            "REQUEST A CHPS WORKER\n\n"
            "1. Pregnancy or newborn\n"
            "2. Child health\n"
            "3. Nutrition\n"
            "4. Referral or follow-up\n"
            "5. Other health concern\n"
            "0. Emergency help\n"
            "9. Back"
        )
    if screen == "demonstrationInformation":
        return DEMO_INFO
    if screen == "locationInput":
        return (
            "Enter community, town or nearest landmark.\n\n"
            "Example: Tolon Station\n\n"
            "Use synthetic demonstration locations only.\n\n"
            "9. Back"
        )
    if screen == "phoneInput":
        return (
            "Enter or confirm a callback phone number.\n\n"
            "Use synthetic demonstration numbers only.\n\n"
            "9. Back"
        )
    if screen == "consentInput":
        if session.require_location_consent:
            return (
                "NorthCare will share your contact and community or landmark\n"
                "with an authorised health worker in this sandbox.\n\n"
                "You also consent to share location details for urgent human review.\n\n"
                "1. Agree and send\n"
                "2. Cancel"
            )
        return (
            "NorthCare will share your contact and community or landmark\n"
            "with an authorised health worker in this sandbox.\n\n"
            "1. Agree and send\n"
            "2. Cancel"
        )
    if screen == "statusReferenceInput":
        return "CHECK REQUEST\n\nEnter your NorthCare reference.\n\n9. Back"
    if screen == "statusPinInput":
        return "CHECK REQUEST\n\nEnter your six-digit status PIN.\n\n9. Back"
    if screen == "languageMenu":
        return (
            "CHOOSE LANGUAGE\n\n"
            "1. English\n"
            "2. Dagbanli - planned\n"
            "3. Hausa - planned\n"
            "4. Dagaare - planned\n"
            "5. Request language assistance\n"
            "9. Back"
        )
    if screen == "languagePlanned":
        return (
            "This language is planned but is not yet professionally reviewed.\n\n"
            "Continue in English.\n\n"
            "0. Main menu\n"
            "9. Back"
        )
    if screen == "languageAssistance":
        return (
            "A future version may help connect you to an appropriate health worker\n"
            "for language assistance.\n\n"
            "No language-assistance request is created in this sandbox.\n\n"
            "0. Main menu\n"
            "9. Back"
        )
    if screen == "askNorthCareMenu":
        return ASK_MENU_SHORTCUTS
    if screen == "askFaqAnswer":
        entry = FAQ_BY_KEY.get(session.ask_faq_key or "")
        if entry is None:
            return NO_MATCH_MESSAGE
        return format_faq_answer_screen(entry)
    if screen == "askNoMatch":
        return NO_MATCH_MESSAGE
    return "NORTHCARE REACH\n\nSession error. Please dial again."


def push_screen(session: AtUssdSession, next_screen: str) -> None:
    session.stack.append(session.screen)
    session.screen = next_screen


def go_back(session: AtUssdSession) -> None:
    if not session.stack:
        session.screen = "mainMenu"
        return
    session.screen = session.stack.pop()
    if session.screen == "mainMenu":
        session.category = None
        session.request_type = None
        session.require_location_consent = False


def go_main_menu(session: AtUssdSession) -> None:
    session.stack = []
    session.screen = "mainMenu"
    session.category = None
    session.request_type = None
    session.require_location_consent = False
    session.info_return_screen = None
    session.ask_faq_key = None


def begin_request_flow(
    session: AtUssdSession,
    *,
    category: str,
    request_type: str,
    require_location_consent: bool,
) -> None:
    session.category = category
    session.request_type = request_type
    session.require_location_consent = require_location_consent
    session.community_or_landmark = None
    session.contact_number = None
    session.consent_to_share_location = False
    push_screen(session, "locationInput")


def continue_menu(session: AtUssdSession) -> NavResult:
    return NavResult(reply=con(screen_text(session)))


def apply_input(session: AtUssdSession, raw: str) -> NavResult:
    """Apply one AT text segment; return CON/END or a create/status action."""
    choice = raw  # keep raw for free-text; trim for menu keys where needed
    trimmed = raw.strip()
    screen = session.screen

    if screen == "mainMenu":
        return _handle_main_menu(session, trimmed)
    if screen == "emergencyMenu":
        return _handle_emergency(session, trimmed)
    if screen == "pregnancyMenu":
        return _handle_topic(session, trimmed, "pregnancyMenu", "pregnancyNewborn")
    if screen == "childHealthMenu":
        return _handle_topic(session, trimmed, "childHealthMenu", "childHealth")
    if screen == "nutritionMenu":
        return _handle_topic(session, trimmed, "nutritionMenu", "nutrition")
    if screen == "chpsReasonMenu":
        return _handle_chps_reason(session, trimmed)
    if screen == "demonstrationInformation":
        return _handle_demo_info(session, trimmed)
    if screen == "locationInput":
        return _handle_location(session, choice)
    if screen == "phoneInput":
        return _handle_phone(session, choice)
    if screen == "consentInput":
        return _handle_consent(session, trimmed)
    if screen == "statusReferenceInput":
        return _handle_status_reference(session, choice)
    if screen == "statusPinInput":
        return _handle_status_pin(session, trimmed)
    if screen == "languageMenu":
        return _handle_language(session, trimmed)
    if screen in ("languagePlanned", "languageAssistance"):
        return _handle_simple_nav(session, trimmed)
    if screen == "askNorthCareMenu":
        return _handle_ask_northcare(session, choice)
    if screen == "askFaqAnswer":
        return _handle_ask_faq_answer(session, trimmed)
    if screen == "askNoMatch":
        return _handle_ask_no_match(session, trimmed)
    return NavResult(reply=end("Session error. Please dial again."), end_session_drop=True)


def _retry(session: AtUssdSession, message: str) -> NavResult:
    return NavResult(reply=con(f"{message}\n\n{screen_text(session)}"))


def _handle_main_menu(session: AtUssdSession, choice: str) -> NavResult:
    mapping = {
        "0": "emergencyMenu",
        "1": "pregnancyMenu",
        "2": "childHealthMenu",
        "3": "nutritionMenu",
        "4": "chpsReasonMenu",
        "6": "languageMenu",
        "7": "askNorthCareMenu",
    }
    if choice in mapping:
        if choice == "7":
            session.ask_faq_key = None
        push_screen(session, mapping[choice])
        return continue_menu(session)
    if choice == "5":
        session.status_check_reference = None
        push_screen(session, "statusReferenceInput")
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _begin_ask_worker_followup(session: AtUssdSession) -> NavResult:
    """Offer existing Reach create flow — never auto-create from a question alone."""
    begin_request_flow(
        session,
        category="generalChps",
        request_type="routine",
        require_location_consent=False,
    )
    return continue_menu(session)


def _show_faq_entry(session: AtUssdSession, faq_key: str) -> NavResult:
    session.ask_faq_key = faq_key
    push_screen(session, "askFaqAnswer")
    return continue_menu(session)


def _handle_ask_northcare(session: AtUssdSession, raw: str) -> NavResult:
    choice = raw.strip()
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    if choice == "0":
        push_screen(session, "emergencyMenu")
        return continue_menu(session)
    if choice == "6":
        return _begin_ask_worker_followup(session)
    if choice in FAQ_BY_CHOICE:
        return _show_faq_entry(session, FAQ_BY_CHOICE[choice].key)

    # Free-text community question → approved FAQ keyword match only (no LLM).
    if not choice or _FORBIDDEN_STAR in choice or len(choice) > 200:
        return _retry(session, "Type a short community question, or choose 1-6.")
    matched = match_faq(choice)
    if matched is None:
        push_screen(session, "askNoMatch")
        return continue_menu(session)
    return _show_faq_entry(session, matched.key)


def _handle_ask_faq_answer(session: AtUssdSession, choice: str) -> NavResult:
    entry = FAQ_BY_KEY.get(session.ask_faq_key or "")
    if entry is not None and entry.is_emergency:
        if choice == "1":
            return NavResult(
                reply=end(
                    "Please end this session and dial 112 now.\n\n"
                    "NorthCare has not placed the call."
                ),
                end_session_drop=True,
            )
        if choice == "2":
            begin_request_flow(
                session,
                category="emergency",
                request_type="urgentContact",
                require_location_consent=False,
            )
            return continue_menu(session)
        if choice == "6":
            return _begin_ask_worker_followup(session)
        if choice == "9":
            go_back(session)
            return continue_menu(session)
        return _retry(session, INVALID_CHOICE)

    if choice == "1":
        return _begin_ask_worker_followup(session)
    if choice == "0":
        push_screen(session, "emergencyMenu")
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _handle_ask_no_match(session: AtUssdSession, choice: str) -> NavResult:
    if choice == "1":
        return _begin_ask_worker_followup(session)
    if choice == "0":
        push_screen(session, "emergencyMenu")
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _handle_emergency(session: AtUssdSession, choice: str) -> NavResult:
    if choice == "1":
        return NavResult(
            reply=end(
                "Please end this session and dial 112 now.\n\n"
                "NorthCare has not placed the call."
            ),
            end_session_drop=True,
        )
    if choice == "2":
        begin_request_flow(
            session,
            category="emergency",
            request_type="emergencyAssistance",
            require_location_consent=True,
        )
        return continue_menu(session)
    if choice == "3":
        begin_request_flow(
            session,
            category="emergency",
            request_type="urgentContact",
            require_location_consent=False,
        )
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _handle_topic(
    session: AtUssdSession, choice: str, return_screen: str, request_category: str
) -> NavResult:
    if choice == "0":
        push_screen(session, "emergencyMenu")
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    if choice == "6":
        begin_request_flow(
            session,
            category=request_category,
            request_type="routine",
            require_location_consent=False,
        )
        return continue_menu(session)
    if choice in {"1", "2", "3", "4", "5"}:
        session.info_return_screen = return_screen
        push_screen(session, "demonstrationInformation")
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _handle_chps_reason(session: AtUssdSession, choice: str) -> NavResult:
    categories = {
        "1": "pregnancyNewborn",
        "2": "childHealth",
        "3": "nutrition",
        "4": "referralFollowUp",
        "5": "generalChps",
    }
    if choice == "0":
        push_screen(session, "emergencyMenu")
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    if choice in categories:
        begin_request_flow(
            session,
            category=categories[choice],
            request_type="routine",
            require_location_consent=False,
        )
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _handle_demo_info(session: AtUssdSession, choice: str) -> NavResult:
    if choice == "1":
        category = "generalChps"
        if session.info_return_screen == "pregnancyMenu":
            category = "pregnancyNewborn"
        elif session.info_return_screen == "childHealthMenu":
            category = "childHealth"
        elif session.info_return_screen == "nutritionMenu":
            category = "nutrition"
        begin_request_flow(
            session,
            category=category,
            request_type="routine",
            require_location_consent=False,
        )
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _handle_location(session: AtUssdSession, raw: str) -> NavResult:
    if raw.strip() == "9":
        go_back(session)
        return continue_menu(session)
    value = raw.strip()
    if not value or len(value) > 200 or _FORBIDDEN_STAR in value:
        return _retry(session, "Enter a community, town or nearest landmark.")
    session.community_or_landmark = value
    push_screen(session, "phoneInput")
    return continue_menu(session)


def _handle_phone(session: AtUssdSession, raw: str) -> NavResult:
    if raw.strip() == "9":
        go_back(session)
        return continue_menu(session)
    value = raw.strip()
    if not CONTACT_PATTERN.fullmatch(value):
        return _retry(session, "Enter a valid synthetic phone number.")
    session.contact_number = value
    push_screen(session, "consentInput")
    return continue_menu(session)


def _handle_consent(session: AtUssdSession, choice: str) -> NavResult:
    if choice == "2":
        go_main_menu(session)
        session.clear_sensitive()
        return continue_menu(session)
    if choice != "1":
        return _retry(session, INVALID_CHOICE)
    session.consent_to_share_location = bool(session.require_location_consent)
    return NavResult(create_request=True)


def _handle_status_reference(session: AtUssdSession, raw: str) -> NavResult:
    if raw.strip() == "9":
        go_back(session)
        return continue_menu(session)
    value = raw.strip().upper()
    if not is_valid_reference_format(value):
        return _retry(session, "Enter a valid NorthCare reference.")
    session.status_check_reference = value
    push_screen(session, "statusPinInput")
    return continue_menu(session)


def _handle_status_pin(session: AtUssdSession, choice: str) -> NavResult:
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    if not PIN_PATTERN.fullmatch(choice):
        return _retry(session, "Enter a six-digit status PIN.")
    return NavResult(status_lookup_pin=choice)


def _handle_language(session: AtUssdSession, choice: str) -> NavResult:
    if choice == "1":
        go_main_menu(session)
        return continue_menu(session)
    if choice in {"2", "3", "4"}:
        push_screen(session, "languagePlanned")
        return continue_menu(session)
    if choice == "5":
        push_screen(session, "languageAssistance")
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def _handle_simple_nav(session: AtUssdSession, choice: str) -> NavResult:
    if choice == "0":
        go_main_menu(session)
        return continue_menu(session)
    if choice == "9":
        go_back(session)
        return continue_menu(session)
    return _retry(session, INVALID_CHOICE)


def format_create_success(
    *,
    reference_code: str,
    status_pin: str,
    is_emergency: bool,
) -> UssdReply:
    if is_emergency:
        message = (
            "Emergency coordination simulation\n\n"
            "Request received\n\n"
            f"Reference: {reference_code}\n\n"
            f"Status PIN: {status_pin}\n\n"
            "Save this PIN privately. It will not be shown again.\n\n"
            "If someone is in immediate danger, call 112 now.\n\n"
            "Sandbox content - live emergency-service integration pending"
        )
    else:
        message = (
            "REQUEST RECEIVED\n\n"
            f"Reference: {reference_code}\n\n"
            f"Status PIN: {status_pin}\n\n"
            "Save this PIN privately. It will not be shown again.\n\n"
            "Keep these details private.\n\n"
            "Call 112 if someone is in immediate danger.\n\n"
            "AT sandbox - not a live Ghana shortcode"
        )
    return end(message)


def format_status_success(label: str) -> UssdReply:
    return end(f"CHECK REQUEST\n\n{label}")


def format_create_failure(message: str = UNAVAILABLE) -> UssdReply:
    return end(message)


def format_status_failure(message: str = GENERIC_LOOKUP_FAIL) -> UssdReply:
    return end(message)
