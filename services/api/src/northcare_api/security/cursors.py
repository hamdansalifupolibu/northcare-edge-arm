from __future__ import annotations

import base64
import hashlib
import hmac
import json
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SyncCursor:
    sequence: int
    account_id: str
    organisation_id: str
    facility_id: str
    role: str


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


class CursorCodec:
    def __init__(self, secret: str) -> None:
        self._secret = secret.encode("utf-8")

    def encode(self, cursor: SyncCursor) -> str:
        payload = {
            "s": cursor.sequence,
            "a": cursor.account_id,
            "o": cursor.organisation_id,
            "f": cursor.facility_id,
            "r": cursor.role,
        }
        raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
        sig = hmac.new(self._secret, raw, hashlib.sha256).digest()
        # Encode parts separately so binary HMAC bytes cannot break the delimiter.
        return f"{_b64encode(raw)}.{_b64encode(sig)}"

    def decode(
        self,
        token: str,
        *,
        account_id: str,
        organisation_id: str,
        facility_id: str,
        role: str,
    ) -> SyncCursor:
        try:
            raw_b64, sig_b64 = token.split(".", 1)
            raw = _b64decode(raw_b64)
            sig = _b64decode(sig_b64)
            expected = hmac.new(self._secret, raw, hashlib.sha256).digest()
            if not hmac.compare_digest(sig, expected):
                raise ValueError("CURSOR_INVALID")
            payload = json.loads(raw.decode("utf-8"))
            cursor = SyncCursor(
                sequence=int(payload["s"]),
                account_id=str(payload["a"]),
                organisation_id=str(payload["o"]),
                facility_id=str(payload["f"]),
                role=str(payload["r"]),
            )
        except Exception as exc:
            raise ValueError("CURSOR_INVALID") from exc
        if (
            cursor.account_id != account_id
            or cursor.organisation_id != organisation_id
            or cursor.facility_id != facility_id
            or cursor.role != role
        ):
            raise ValueError("CURSOR_INVALID")
        return cursor
