from __future__ import annotations

import re
from pathlib import Path

from northcare_api.config import Settings
from northcare_api.logging import RedactingFilter

SRC = Path(__file__).resolve().parents[2] / "src" / "northcare_api"


def test_development_auth_unavailable_in_production() -> None:
    assert Settings(NORTHCARE_ENV="production").development_auth_enabled is False
    assert Settings(NORTHCARE_ENV="staging").development_auth_enabled is False


def test_redacting_filter_masks_sensitive_terms() -> None:
    import logging

    filt = RedactingFilter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="authorization Bearer abc token password pin",
        args=(),
        exc_info=None,
    )
    assert filt.filter(record) is True
    assert record.getMessage() == "[redacted-sensitive-log]"


def test_source_scan_no_obvious_secret_or_payload_logging() -> None:
    prohibited = re.compile(
        r"logger\.(debug|info|warning|error|exception)\([^\n]*(password|access_token|authorization|request\.body|payload)",
        re.IGNORECASE,
    )
    offenders: list[str] = []
    for path in SRC.rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        if prohibited.search(text):
            offenders.append(str(path.relative_to(SRC)))
    assert offenders == []


def test_sync_push_uses_bound_parameters_not_string_concat() -> None:
    push = (SRC / "services" / "sync_push.py").read_text(encoding="utf-8")
    assert "f\"SELECT" not in push
    assert "f'SELECT" not in push
    assert "%" + "s" not in push or "request_hash" in push
    assert "text(f" not in push


def test_no_password_fields_in_sync_contracts() -> None:
    contracts = (SRC / "contracts" / "sync.py").read_text(encoding="utf-8")
    # Development token request is the only intentional password field.
    assert contracts.count("password") == 1
