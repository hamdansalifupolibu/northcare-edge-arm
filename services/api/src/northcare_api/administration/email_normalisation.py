from __future__ import annotations

import re

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_MAX_EMAIL_LENGTH = 320


def normalise_email(value: str) -> str:
    candidate = value.strip().lower()
    if not candidate or len(candidate) > _MAX_EMAIL_LENGTH:
        raise ValueError("invalid_email")
    if not _EMAIL.fullmatch(candidate):
        raise ValueError("invalid_email")
    return candidate
