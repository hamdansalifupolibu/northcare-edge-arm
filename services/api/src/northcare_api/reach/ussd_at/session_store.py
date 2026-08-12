"""In-memory AT USSD session store keyed by sessionId + serviceCode."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AtUssdSession:
    session_id: str
    service_code: str
    screen: str = "mainMenu"
    stack: list[str] = field(default_factory=list)
    category: str | None = None
    request_type: str | None = None
    community_or_landmark: str | None = None
    contact_number: str | None = None
    consent_to_share_location: bool = False
    require_location_consent: bool = False
    info_return_screen: str | None = None
    ask_faq_key: str | None = None
    status_check_reference: str | None = None
    processed_input_count: int = 0
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def touch(self) -> None:
        self.updated_at = time.time()

    def clear_sensitive(self) -> None:
        self.community_or_landmark = None
        self.contact_number = None
        self.status_check_reference = None
        self.consent_to_share_location = False
        self.ask_faq_key = None


class AtUssdSessionStore:
    """Process-local session store with TTL cleanup (sandbox / single-node T1)."""

    def __init__(self, *, ttl_seconds: int = 300) -> None:
        self._ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._sessions: dict[str, AtUssdSession] = {}

    @staticmethod
    def _key(session_id: str, service_code: str) -> str:
        return f"{service_code}::{session_id}"

    def get_or_create(self, *, session_id: str, service_code: str) -> AtUssdSession:
        key = self._key(session_id, service_code)
        now = time.time()
        with self._lock:
            self._purge_expired_unlocked(now)
            existing = self._sessions.get(key)
            if existing is not None:
                existing.touch()
                return existing
            session = AtUssdSession(session_id=session_id, service_code=service_code)
            self._sessions[key] = session
            return session

    def drop(self, *, session_id: str, service_code: str) -> None:
        key = self._key(session_id, service_code)
        with self._lock:
            self._sessions.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._sessions.clear()

    def _purge_expired_unlocked(self, now: float) -> None:
        expired = [
            key
            for key, session in self._sessions.items()
            if now - session.updated_at > self._ttl_seconds
        ]
        for key in expired:
            del self._sessions[key]


# Module singleton used by the webhook (tests may call .clear()).
SESSION_STORE = AtUssdSessionStore()


def session_snapshot(session: AtUssdSession) -> dict[str, Any]:
    """Non-sensitive snapshot for unit tests."""
    return {
        "screen": session.screen,
        "stack": list(session.stack),
        "category": session.category,
        "requestType": session.request_type,
        "processedInputCount": session.processed_input_count,
        "requireLocationConsent": session.require_location_consent,
    }
