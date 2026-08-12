"""Privacy-safe community-request reference codes."""

from __future__ import annotations

import secrets

# Crockford-like alphabet without ambiguous characters (0/O, 1/I/L).
_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
_PREFIX = "NCR-"
_BODY_LENGTH = 8
_MAX_COLLISION_RETRIES = 8


def generate_reference_code() -> str:
    """Return a non-sequential human-readable reference (e.g. NCR-7K4M9Q2D)."""
    body = "".join(secrets.choice(_ALPHABET) for _ in range(_BODY_LENGTH))
    return f"{_PREFIX}{body}"


def reference_collision_retry_limit() -> int:
    return _MAX_COLLISION_RETRIES


def is_valid_reference_format(value: str) -> bool:
    if not value.startswith(_PREFIX):
        return False
    body = value[len(_PREFIX) :]
    if len(body) != _BODY_LENGTH:
        return False
    return all(char in _ALPHABET for char in body)
