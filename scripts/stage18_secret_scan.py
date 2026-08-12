"""Stage 18 secret scan — reports path + category only; never prints match values."""

from __future__ import annotations

import os
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PATTERNS: dict[str, re.Pattern[str]] = {
    "private_key_block": re.compile(r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "firebase_service_account_json": re.compile(r'"type"\s*:\s*"service_account"'),
    "aws_access_key_id_like": re.compile(r"AKIA[0-9A-Z]{16}"),
    "jwt_like_compact": re.compile(
        r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
    ),
    "generic_api_key_assignment": re.compile(
        r"(?i)(api[_-]?key|secret[_-]?key|private[_-]?key)\s*[:=]\s*[\"'][^\"']{8,}"
    ),
    "password_assignment_literal": re.compile(
        r"(?i)(password|passwd|pwd)\s*[:=]\s*[\"'][^\"']{4,}"
    ),
    "bearer_literal": re.compile(r"(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*"),
    "connection_string_with_password": re.compile(
        r"(?i)(postgres(ql)?|mysql|mongodb)://[^:\s]+:[^@\s]+@"
    ),
}

SKIP_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "dist",
    "build",
    ".expo",
    "__pycache__",
    ".mypy_cache",
    ".ruff_cache",
    "coverage",
    ".cursor",
    "agent-transcripts",
}
SKIP_EXT = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".mp3",
    ".wav",
    ".mp4",
    ".lock",
    ".db",
    ".sqlite",
    ".map",
}
SKIP_NAMES = {"_STAGE_18_PROMPT_EXTRACT.md"}


def main() -> None:
    findings: list[tuple[str, str, int]] = []
    scanned = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for filename in filenames:
            path = Path(dirpath) / filename
            if path.suffix.lower() in SKIP_EXT or path.name in SKIP_NAMES:
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            scanned += 1
            rel = str(path.relative_to(ROOT)).replace("\\", "/")
            for category, pattern in PATTERNS.items():
                matches = pattern.findall(text)
                if matches:
                    findings.append((rel, category, len(matches)))

    by_cat: dict[str, list[str]] = defaultdict(list)
    for rel, category, _count in findings:
        by_cat[category].append(rel)

    print(f"SCANNED_FILES {scanned}")
    print(f"FINDING_ROWS {len(findings)}")
    for category in sorted(by_cat):
        uniq = sorted(set(by_cat[category]))
        print(f"CATEGORY {category} COUNT {len(uniq)}")
        for path in uniq:
            print(f"  {path}")


if __name__ == "__main__":
    main()
