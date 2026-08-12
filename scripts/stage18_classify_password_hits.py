"""Classify password-literal scan hits without printing secret values."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RX = re.compile(r"(?i)(password|passwd|pwd)\s*[:=]\s*[\"']([^\"']{4,})[\"']")

PATHS = [
    "apps/mobile/src/__tests__/logger.test.ts",
    "apps/mobile/src/features/administration/__tests__/registrationFlow.test.ts",
    "apps/mobile/src/features/auth/__tests__/authSession.test.tsx",
    "apps/mobile/src/features/auth/__tests__/developmentAuth.test.ts",
    "apps/mobile/src/features/auth/services/DevelopmentAuthProvider.ts",
    "apps/mobile/src/i18n/en.ts",
    "services/api/src/northcare_api/cli/provision_development_account.py",
    "services/api/src/northcare_api/cli/provision_development_worker.py",
    "services/api/tests/unit/test_provision_development_account.py",
]


def classify(value: str) -> list[str]:
    lower = value.lower()
    tags: list[str] = []
    if any(x in lower for x in ("test", "demo", "fake", "synthetic", "example", "dummy", "changeme")):
        tags.append("synthetic_or_demo")
    if lower in {"password", "secret", "****", "placeholder"}:
        tags.append("placeholder")
    if " " in value and len(value.split()) >= 3:
        tags.append("likely_ui_copy")
    if "@" in value:
        tags.append("email_like")
    if len(value) >= 8 and any(c.isdigit() for c in value) and any(c.isalpha() for c in value):
        tags.append("complex_looking")
    if not tags:
        tags.append("review")
    return tags


def main() -> None:
    for rel in PATHS:
        text = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
        for i, line in enumerate(text.splitlines(), 1):
            match = RX.search(line)
            if not match:
                continue
            key, value = match.group(1), match.group(2)
            print(f"{rel}:{i} key={key} len={len(value)} tags={classify(value)}")


if __name__ == "__main__":
    main()
