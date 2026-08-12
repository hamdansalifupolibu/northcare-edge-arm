from __future__ import annotations

import pytest

from northcare_api.config import Settings

# Isolate from developer .env (AT/demo may be enabled locally).
_CLOSED_REACH = {
    "NORTHCARE_REACH_DEMO_ENABLED": False,
    "NORTHCARE_REACH_AT_USSD_ENABLED": False,
    "NORTHCARE_REACH_AT_USSD_MODE": "sandbox",
    "NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET": "",
    "NORTHCARE_REACH_AT_USSD_SERVICE_CODES": "",
}


def test_production_disables_development_auth() -> None:
    settings = Settings(NORTHCARE_ENV="production", **_CLOSED_REACH)
    assert settings.development_auth_enabled is False
    assert settings.firebase_configured is False


def test_staging_disables_development_auth() -> None:
    settings = Settings(NORTHCARE_ENV="staging", **_CLOSED_REACH)
    assert settings.development_auth_enabled is False


def test_placeholder_secrets_remain_development_markers_when_unconfigured() -> None:
    """Explicit overrides document that placeholder secrets must not ship as production config."""
    settings = Settings(
        NORTHCARE_ENV="production",
        DEV_AUTH_SECRET="dev-only-change-me-not-for-production",
        CURSOR_SIGNING_SECRET="dev-cursor-signing-secret-change-me",
        FIREBASE_PROJECT_ID="",
        GOOGLE_APPLICATION_CREDENTIALS="",
        **_CLOSED_REACH,
    )
    assert "not-for-production" in settings.dev_auth_secret
    assert "change-me" in settings.cursor_signing_secret
    assert settings.firebase_configured is False


def test_development_and_test_enable_development_auth() -> None:
    assert Settings(NORTHCARE_ENV="development", **_CLOSED_REACH).development_auth_enabled is True
    assert Settings(NORTHCARE_ENV="test", **_CLOSED_REACH).development_auth_enabled is True


def test_hosted_postgres_urls_normalise_to_asyncpg() -> None:
    """Fly/Railway/Neon often inject postgres:// or postgresql:// without +asyncpg."""
    assert Settings(
        DATABASE_URL="postgres://u:p@db.example:5432/northcare",
        **_CLOSED_REACH,
    ).database_url.startswith("postgresql+asyncpg://")
    assert (
        Settings(
            DATABASE_URL="postgresql://u:p@db.example:5432/northcare",
            **_CLOSED_REACH,
        ).database_url
        == "postgresql+asyncpg://u:p@db.example:5432/northcare"
    )
    assert (
        Settings(
            DATABASE_URL="postgresql+asyncpg://u:p@db.example:5432/northcare",
            **_CLOSED_REACH,
        ).database_url
        == "postgresql+asyncpg://u:p@db.example:5432/northcare"
    )


def test_at_ussd_enablement_refused_outside_development_and_test() -> None:
    with pytest.raises(ValueError, match="NORTHCARE_REACH_AT_USSD_ENABLED"):
        Settings(
            NORTHCARE_ENV="staging",
            NORTHCARE_REACH_AT_USSD_ENABLED=True,
            NORTHCARE_REACH_AT_USSD_MODE="sandbox",
            NORTHCARE_REACH_DEMO_ENABLED=False,
        )
