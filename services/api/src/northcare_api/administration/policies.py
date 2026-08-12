from __future__ import annotations

import time

from northcare_api.administration.errors import (
    ADMINISTRATOR_REAUTHENTICATION_REQUIRED,
    ADMINISTRATOR_ROLE_REQUIRED,
    FORBIDDEN,
    AdministrationError,
)
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.config import Settings

# Fresh admin auth window for sensitive mutations (seconds).
FRESH_ADMIN_TOKEN_MAX_AGE_SECONDS = 15 * 60


def require_admin(account: AuthenticatedAccount) -> None:
    if not account.is_active or account.account_status == "inactive":
        raise FORBIDDEN
    if not account.has_admin_role:
        raise ADMINISTRATOR_ROLE_REQUIRED


def require_fresh_admin_token(
    account: AuthenticatedAccount,
    token_issued_at: int | None,
    *,
    now: int | None = None,
    max_age_seconds: int = FRESH_ADMIN_TOKEN_MAX_AGE_SECONDS,
) -> None:
    require_admin(account)
    if token_issued_at is None:
        raise ADMINISTRATOR_REAUTHENTICATION_REQUIRED
    current = now if now is not None else int(time.time())
    if current - token_issued_at > max_age_seconds:
        raise ADMINISTRATOR_REAUTHENTICATION_REQUIRED


def assert_same_organisation(actor: AuthenticatedAccount, organisation_id: str) -> None:
    if actor.organisation_id != organisation_id:
        raise FORBIDDEN


def password_meets_policy(value: str) -> bool:
    return (
        len(value) >= 12
        and any(character.islower() for character in value)
        and any(character.isupper() for character in value)
        and any(character.isdigit() for character in value)
    )


def development_provisioning_allowed(settings: Settings) -> bool:
    return settings.northcare_env == "development"


def raise_admin_http(error: AdministrationError) -> None:
    raise error
