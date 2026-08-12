"""Privacy-safe helpers for AT USSD logging (no PIN / full phone / health free-text)."""

from __future__ import annotations


def mask_phone(phone: str | None) -> str:
    """Mask MSISDN for logs. Keeps country hint when present; never returns full number."""
    if not phone:
        return "<empty>"
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) < 4:
        return "***"
    return f"***{digits[-2:]}"


def mask_session_id(session_id: str | None) -> str:
    if not session_id:
        return "<empty>"
    if len(session_id) <= 8:
        return "***"
    return f"{session_id[:4]}…{session_id[-2:]}"


def safe_service_code(service_code: str | None) -> str:
    if not service_code:
        return "<empty>"
    # Service codes are not secrets; truncate only if unusually long.
    return service_code[:32]
