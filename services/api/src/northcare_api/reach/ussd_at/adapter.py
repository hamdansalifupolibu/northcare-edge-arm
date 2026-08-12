"""Africa's Talking USSD request adapter — maps AT form POST to Reach menus/services."""

from __future__ import annotations

import logging
import secrets
from typing import Any

from northcare_api.config import Settings
from northcare_api.reach.enums import CommunityRequestCategory, CommunityRequestChannel
from northcare_api.reach.errors import ReachError
from northcare_api.reach.service import ReachService
from northcare_api.reach.ussd_at.menus import (
    UNAVAILABLE,
    apply_input,
    continue_menu,
    format_create_failure,
    format_create_success,
    format_status_failure,
    format_status_success,
    split_at_text,
)
from northcare_api.reach.ussd_at.redaction import mask_phone, mask_session_id, safe_service_code
from northcare_api.reach.ussd_at.response import UssdReply, end
from northcare_api.reach.ussd_at.session_store import SESSION_STORE, AtUssdSessionStore

logger = logging.getLogger("northcare_api.reach.ussd_at")

_MAX_TEXT_LEN = 512
_MAX_FIELD_LEN = 64
_MAX_PHONE_LEN = 20


class AtUssdGateError(Exception):
    """Adapter refused the request before menu handling."""

    def __init__(self, code: str, *, http_status: int = 403) -> None:
        self.code = code
        self.http_status = http_status
        super().__init__(code)


def require_at_ussd_sandbox(settings: Settings) -> None:
    """Fail closed unless sandbox AT USSD is explicitly enabled in development/test."""
    if not settings.reach_at_ussd_enabled:
        raise AtUssdGateError("atUssdDisabled", http_status=403)
    if not settings.reach_demo_enabled:
        raise AtUssdGateError("reachDemoDisabled", http_status=403)
    if settings.reach_at_ussd_mode != "sandbox":
        raise AtUssdGateError("atUssdLiveRejected", http_status=403)
    if not settings.reach_at_ussd_callback_secret:
        raise AtUssdGateError("atUssdMisconfigured", http_status=503)


def verify_callback_secret(settings: Settings, path_secret: str) -> None:
    expected = settings.reach_at_ussd_callback_secret
    if not expected or not path_secret:
        raise AtUssdGateError("atUssdUnauthorized", http_status=401)
    if not secrets.compare_digest(path_secret, expected):
        raise AtUssdGateError("atUssdUnauthorized", http_status=401)


def parse_at_form(form: dict[str, Any]) -> dict[str, str]:
    """Extract AT USSD fields from form-urlencoded body."""

    def _get(name: str, *, required: bool = True, max_len: int = _MAX_FIELD_LEN) -> str:
        raw = form.get(name)
        if raw is None:
            if required:
                raise AtUssdGateError("atUssdInvalidPayload", http_status=400)
            return ""
        if not isinstance(raw, str):
            raw = str(raw)
        value = raw.strip()
        if required and not value:
            raise AtUssdGateError("atUssdInvalidPayload", http_status=400)
        if len(value) > max_len:
            raise AtUssdGateError("atUssdPayloadTooLarge", http_status=413)
        return value

    session_id = _get("sessionId", max_len=_MAX_FIELD_LEN)
    phone_number = _get("phoneNumber", max_len=_MAX_PHONE_LEN)
    service_code = _get("serviceCode", max_len=_MAX_FIELD_LEN)
    text = _get("text", required=False, max_len=_MAX_TEXT_LEN)
    network_code = _get("networkCode", required=False, max_len=_MAX_FIELD_LEN)
    return {
        "sessionId": session_id,
        "phoneNumber": phone_number,
        "serviceCode": service_code,
        "text": text,
        "networkCode": network_code,
    }


def normalize_service_code(service_code: str) -> str:
    """Normalize AT serviceCode variants (trim; treat trailing # as optional)."""
    code = service_code.strip()
    if code.endswith("#"):
        return code[:-1]
    return code


def expand_service_code_allowlist(codes: frozenset[str]) -> frozenset[str]:
    """Accept allowlist entries with or without a trailing #."""
    expanded: set[str] = set()
    for raw in codes:
        code = raw.strip()
        if not code:
            continue
        bare = normalize_service_code(code)
        expanded.add(bare)
        expanded.add(f"{bare}#")
    return frozenset(expanded)


def assert_service_code_allowed(settings: Settings, service_code: str) -> None:
    allowed = expand_service_code_allowlist(settings.reach_at_ussd_service_codes_set)
    if not allowed:
        raise AtUssdGateError("atUssdMisconfigured", http_status=503)
    if service_code.strip() not in allowed:
        raise AtUssdGateError("atUssdServiceCodeRejected", http_status=403)


async def handle_at_ussd_request(
    *,
    form: dict[str, Any],
    settings: Settings,
    service: ReachService,
    store: AtUssdSessionStore = SESSION_STORE,
) -> UssdReply:
    """Drive one AT callback: return CON/END reply. Never logs PINs or full phone."""
    require_at_ussd_sandbox(settings)
    fields = parse_at_form(form)
    assert_service_code_allowed(settings, fields["serviceCode"])

    logger.info(
        "at_ussd_callback session=%s phone=%s service=%s text_segments=%s",
        mask_session_id(fields["sessionId"]),
        mask_phone(fields["phoneNumber"]),
        safe_service_code(fields["serviceCode"]),
        len(split_at_text(fields["text"])),
    )

    session = store.get_or_create(
        session_id=fields["sessionId"],
        service_code=fields["serviceCode"],
    )
    segments = split_at_text(fields["text"])

    # First callback (empty text) → main menu.
    if not segments:
        session.screen = "mainMenu"
        session.stack = []
        session.processed_input_count = 0
        session.clear_sensitive()
        return continue_menu(session).reply  # type: ignore[return-value]

    # Process only new segments relative to stored progress (handles AT full-text model).
    if len(segments) < session.processed_input_count:
        # Session restarted with shorter path — reset.
        session.screen = "mainMenu"
        session.stack = []
        session.processed_input_count = 0
        session.clear_sensitive()

    new_segments = segments[session.processed_input_count :]
    reply: UssdReply | None = None
    for segment in new_segments:
        result = apply_input(session, segment)
        session.processed_input_count += 1
        session.touch()

        if result.create_request:
            reply = await _create_request(session, service, store)
            break
        if result.status_lookup_pin is not None:
            reply = await _status_lookup(
                session, service, store, pin=result.status_lookup_pin
            )
            break
        if result.reply is not None:
            reply = result.reply
            if result.end_session_drop or not result.reply.continue_session:
                store.drop(
                    session_id=fields["sessionId"],
                    service_code=fields["serviceCode"],
                )
            # Invalid-choice retries stay CON; keep processing only this segment.
            break

    if reply is None:
        reply = continue_menu(session).reply  # type: ignore[assignment]
    return reply


async def _create_request(
    session: Any,
    service: ReachService,
    store: AtUssdSessionStore,
) -> UssdReply:
    payload = {
        "channel": CommunityRequestChannel.USSD_AT_SANDBOX.value,
        "category": session.category,
        "requestType": session.request_type,
        "contactNumber": session.contact_number,
        "communityOrLandmark": session.community_or_landmark,
        "preferredLanguage": "en",
        "consentToContact": True,
        "consentToShareLocation": bool(session.consent_to_share_location),
    }
    is_emergency = session.category == CommunityRequestCategory.EMERGENCY
    try:
        created = await service.create_public_request(payload)
    except ReachError as exc:
        logger.info("at_ussd_create_failed code=%s", exc.code)
        store.drop(session_id=session.session_id, service_code=session.service_code)
        if exc.code == "reachDemoDisabled":
            return format_create_failure(UNAVAILABLE)
        if exc.code == "validationFailed":
            return format_create_failure(
                "Some details could not be accepted.\nPlease check your entries and try again."
            )
        return format_create_failure(UNAVAILABLE)
    except Exception:
        logger.exception("at_ussd_create_unexpected")
        store.drop(session_id=session.session_id, service_code=session.service_code)
        return format_create_failure(UNAVAILABLE)

    session.clear_sensitive()
    store.drop(session_id=session.session_id, service_code=session.service_code)
    logger.info(
        "at_ussd_create_ok session=%s category=%s",
        mask_session_id(session.session_id),
        session.category,
    )
    return format_create_success(
        reference_code=created.reference_code,
        status_pin=created.status_pin,
        is_emergency=is_emergency,
    )


async def _status_lookup(
    session: Any,
    service: ReachService,
    store: AtUssdSessionStore,
    *,
    pin: str,
) -> UssdReply:
    reference = session.status_check_reference or ""
    try:
        result = await service.public_status_lookup(
            reference_code=reference,
            status_pin=pin,
        )
    except ReachError as exc:
        logger.info("at_ussd_status_failed code=%s", exc.code)
        store.drop(session_id=session.session_id, service_code=session.service_code)
        if exc.code == "statusLookupTemporarilyUnavailable":
            return format_status_failure(
                "Status check is temporarily unavailable.\nPlease try again later."
            )
        return format_status_failure()
    except Exception:
        logger.exception("at_ussd_status_unexpected")
        store.drop(session_id=session.session_id, service_code=session.service_code)
        return format_status_failure(UNAVAILABLE)

    session.clear_sensitive()
    store.drop(session_id=session.session_id, service_code=session.service_code)
    logger.info(
        "at_ussd_status_ok session=%s",
        mask_session_id(session.session_id),
    )
    return format_status_success(result.public_status_label)


def unavailable_reply() -> UssdReply:
    return end(UNAVAILABLE)
