"""CON / END response builders for Africa's Talking USSD."""

from __future__ import annotations

from dataclasses import dataclass

from starlette.responses import Response


@dataclass(frozen=True, slots=True)
class UssdReply:
    """Plain-text AT USSD reply body (must start with CON or END)."""

    continue_session: bool
    message: str

    def to_plain_text(self) -> str:
        prefix = "CON" if self.continue_session else "END"
        body = self.message.strip("\n")
        return f"{prefix} {body}"


def con(message: str) -> UssdReply:
    return UssdReply(continue_session=True, message=message)


def end(message: str) -> UssdReply:
    return UssdReply(continue_session=False, message=message)


def at_plain_text_response(body: str, *, status_code: int = 200) -> Response:
    """AT expects Content-Type: text/plain (no charset suffix)."""
    return Response(
        content=body,
        status_code=status_code,
        headers={"content-type": "text/plain"},
    )
