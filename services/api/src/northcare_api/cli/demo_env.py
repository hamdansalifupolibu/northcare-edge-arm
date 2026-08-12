"""Shared development-only guards for Reach demo CLI commands."""

from __future__ import annotations

import sys

from northcare_api.config import Settings, get_settings

_ALLOWED_ENVS = frozenset({"development"})
_REFUSED_ENVS = frozenset({"staging", "production"})


def refuse_non_development(settings: Settings | None = None) -> int | None:
    """Return an exit code when the environment is not allowed for demo CLIs."""
    active = settings or get_settings()
    if active.northcare_env in _REFUSED_ENVS:
        print(
            f"Refused: Reach demo CLI cannot run when NORTHCARE_ENV={active.northcare_env}.",
            file=sys.stderr,
        )
        return 2
    if active.northcare_env not in _ALLOWED_ENVS:
        print(
            "Refused: Reach demo CLI is available only when NORTHCARE_ENV=development.",
            file=sys.stderr,
        )
        return 2
    return None


def confirm_or_yes(*, yes: bool, prompt: str) -> bool:
    if yes:
        return True
    try:
        answer = input(f"{prompt} Type YES to continue: ").strip()
    except EOFError:
        return False
    return answer == "YES"
