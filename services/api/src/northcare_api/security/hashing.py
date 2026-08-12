from __future__ import annotations

import hashlib
import json
from typing import Any


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def request_hash(value: Any) -> str:
    digest = hashlib.sha256(canonical_json(value).encode("utf-8"))
    return digest.hexdigest()
