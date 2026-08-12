from __future__ import annotations

import logging
import re

_SENSITIVE = re.compile(
    r"(password|pin|token|authorization|transcript|payload|qr)",
    re.IGNORECASE,
)


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        if _SENSITIVE.search(message):
            record.msg = "[redacted-sensitive-log]"
            record.args = ()
        return True


def configure_logging() -> None:
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )
    root.addFilter(RedactingFilter())
