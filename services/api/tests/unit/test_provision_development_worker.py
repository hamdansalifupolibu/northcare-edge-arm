from __future__ import annotations

import secrets
import string

import pytest
from argon2 import PasswordHasher

from northcare_api.cli import provision_development_worker as provision_mod


def _dynamic_password() -> str:
    alphabet = string.ascii_letters + string.digits
    return "Aa1!" + "".join(secrets.choice(alphabet) for _ in range(16))


def test_password_policy_requires_mixed_case_digit_and_length() -> None:
    assert provision_mod._valid_password("Short1!") is False
    assert provision_mod._valid_password("alllowercase1!!!!") is False
    assert provision_mod._valid_password("ALLUPPERCASE1!!!!") is False
    assert provision_mod._valid_password("NoDigitsHere!!!!") is False
    assert provision_mod._valid_password(_dynamic_password()) is True


def test_argon2_verifier_is_not_plaintext() -> None:
    password = _dynamic_password()
    hashed = PasswordHasher().hash(password)
    assert password not in hashed
    assert hashed.startswith("$argon2")


@pytest.mark.asyncio
async def test_provision_refuses_non_development(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeSettings:
        northcare_env = "production"

    monkeypatch.setattr(provision_mod, "get_settings", lambda: FakeSettings())
    code = await provision_mod.provision("worker@example.invalid", update=False)
    assert code == 2
