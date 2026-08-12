"""Six-digit status PIN generation and Argon2id verification.

A six-digit PIN has limited entropy. Lookup throttling and the development-only
Reach gate are required controls. This verifier is separate from account
password, worker local PIN, and referral QR verification.
"""

from __future__ import annotations

import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

STATUS_PIN_DIGITS = 6
_HASHER = PasswordHasher()


def generate_status_pin() -> str:
    """Cryptographically random six-digit PIN with leading zeroes preserved."""
    value = secrets.randbelow(10**STATUS_PIN_DIGITS)
    return f"{value:0{STATUS_PIN_DIGITS}d}"


def hash_status_pin(pin: str) -> str:
    if len(pin) != STATUS_PIN_DIGITS or not pin.isdigit():
        raise ValueError("invalid_status_pin_format")
    return _HASHER.hash(pin)


def verify_status_pin(pin: str, pin_hash: str) -> bool:
    if len(pin) != STATUS_PIN_DIGITS or not pin.isdigit():
        return False
    try:
        return bool(_HASHER.verify(pin_hash, pin))
    except (VerifyMismatchError, InvalidHashError):
        return False
