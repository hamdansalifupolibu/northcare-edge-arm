from __future__ import annotations

from functools import lru_cache
from typing import Literal, Self
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["test", "development", "staging", "production"]
AtUssdMode = Literal["sandbox", "live"]

_ASYNCPG_SSL_TRUE = frozenset(
    {"1", "true", "require", "verify-ca", "verify-full", "prefer"}
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    northcare_env: AppEnv = Field(default="development", alias="NORTHCARE_ENV")
    database_url: str = Field(
        default="postgresql+asyncpg://northcare@127.0.0.1:5432/northcare",
        alias="DATABASE_URL",
    )
    dev_auth_secret: str = Field(
        default="dev-only-change-me-not-for-production",
        alias="DEV_AUTH_SECRET",
    )
    cursor_signing_secret: str = Field(
        default="dev-cursor-signing-secret-change-me",
        alias="CURSOR_SIGNING_SECRET",
    )
    sync_protocol_version: int = Field(default=1, alias="SYNC_PROTOCOL_VERSION")
    firebase_project_id: str = Field(default="", alias="FIREBASE_PROJECT_ID")
    google_application_credentials: str = Field(
        default="",
        alias="GOOGLE_APPLICATION_CREDENTIALS",
    )
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    # NorthCare Reach demonstration gate (default false; development/test only).
    northcare_reach_demo_enabled: bool = Field(
        default=False, alias="NORTHCARE_REACH_DEMO_ENABLED"
    )
    reach_demo_organisation_id: str = Field(
        default="org-dev-001", alias="NORTHCARE_REACH_DEMO_ORGANISATION_ID"
    )
    reach_demo_facility_id: str = Field(
        default="fac-dev-001", alias="NORTHCARE_REACH_DEMO_FACILITY_ID"
    )
    reach_status_lookup_max_failures: int = Field(
        default=5, alias="NORTHCARE_REACH_STATUS_LOOKUP_MAX_FAILURES"
    )
    reach_status_lookup_lockout_seconds: int = Field(
        default=900, alias="NORTHCARE_REACH_STATUS_LOOKUP_LOCKOUT_SECONDS"
    )
    # Africa's Talking USSD adapter (T1) — sandbox only; default disabled.
    northcare_reach_at_ussd_enabled: bool = Field(
        default=False, alias="NORTHCARE_REACH_AT_USSD_ENABLED"
    )
    northcare_reach_at_ussd_mode: AtUssdMode = Field(
        default="sandbox", alias="NORTHCARE_REACH_AT_USSD_MODE"
    )
    northcare_reach_at_ussd_callback_secret: str = Field(
        default="", alias="NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET"
    )
    northcare_reach_at_ussd_service_codes: str = Field(
        default="",
        alias="NORTHCARE_REACH_AT_USSD_SERVICE_CODES",
        description="Comma-separated allowlist of AT sandbox service codes",
    )

    @field_validator("northcare_env", mode="before")
    @classmethod
    def normalize_env(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        """Normalise host URLs for SQLAlchemy asyncpg (Render/Fly/etc.).

        - ``postgres://`` / ``postgresql://`` → ``postgresql+asyncpg://``
        - ``sslmode=…`` (libpq) → ``ssl=true`` (asyncpg rejects ``sslmode``)
        """
        if not isinstance(value, str):
            return value
        url = value.strip()
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://") :]
        elif url.startswith("postgresql://") and "+asyncpg" not in url.split("://", 1)[0]:
            url = "postgresql+asyncpg://" + url[len("postgresql://") :]

        parts = urlsplit(url)
        query = parse_qsl(parts.query, keep_blank_values=True)
        if not query:
            return url

        want_ssl = False
        kept: list[tuple[str, str]] = []
        for key, val in query:
            lower = key.lower()
            if lower == "sslmode":
                if val.lower() in _ASYNCPG_SSL_TRUE:
                    want_ssl = True
                continue
            if lower == "ssl":
                if val.lower() in _ASYNCPG_SSL_TRUE:
                    want_ssl = True
                continue
            kept.append((key, val))
        if want_ssl:
            kept.append(("ssl", "true"))
        return urlunsplit(
            (parts.scheme, parts.netloc, parts.path, urlencode(kept), parts.fragment)
        )

    @field_validator("northcare_reach_at_ussd_mode", mode="before")
    @classmethod
    def normalize_at_mode(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @model_validator(mode="after")
    def reject_reach_demo_outside_development(self) -> Self:
        if self.northcare_reach_demo_enabled and self.northcare_env not in (
            "development",
            "test",
        ):
            raise ValueError(
                "NORTHCARE_REACH_DEMO_ENABLED may only be true in development or test; "
                "staging and production must fail closed"
            )
        if self.northcare_reach_at_ussd_enabled and self.northcare_env not in (
            "development",
            "test",
        ):
            raise ValueError(
                "NORTHCARE_REACH_AT_USSD_ENABLED may only be true in development or test; "
                "staging and production must fail closed"
            )
        if self.northcare_reach_at_ussd_mode == "live":
            raise ValueError(
                "NORTHCARE_REACH_AT_USSD_MODE=live is not available in T1; use sandbox only"
            )
        return self

    @property
    def development_auth_enabled(self) -> bool:
        return self.northcare_env in ("development", "test")

    @property
    def reach_demo_enabled(self) -> bool:
        """True only when the Reach demo flag is on and the environment allows it."""
        return self.northcare_reach_demo_enabled and self.northcare_env in (
            "development",
            "test",
        )

    @property
    def reach_at_ussd_enabled(self) -> bool:
        """True only when AT USSD adapter is on and the environment allows it."""
        return self.northcare_reach_at_ussd_enabled and self.northcare_env in (
            "development",
            "test",
        )

    @property
    def reach_at_ussd_mode(self) -> str:
        return self.northcare_reach_at_ussd_mode

    @property
    def reach_at_ussd_callback_secret(self) -> str:
        return self.northcare_reach_at_ussd_callback_secret.strip()

    @property
    def reach_at_ussd_service_codes_set(self) -> frozenset[str]:
        codes = [
            part.strip()
            for part in self.northcare_reach_at_ussd_service_codes.split(",")
            if part.strip()
        ]
        return frozenset(codes)

    @property
    def firebase_configured(self) -> bool:
        return bool(self.firebase_project_id.strip()) and bool(
            self.google_application_credentials.strip()
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
