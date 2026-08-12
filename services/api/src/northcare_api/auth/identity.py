from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class VerifiedIdentity:
    subject: str
    issuer: str
    email: str | None = None
    token_issued_at: int | None = None


@dataclass(frozen=True, slots=True)
class AuthenticatedAccount:
    account_id: str
    remote_subject: str
    display_name: str
    role: str
    roles: tuple[str, ...]
    organisation_id: str
    facility_id: str
    is_active: bool
    account_status: str
    account_version: int
    first_login_required: bool
    normalised_email: str | None = None
    identity_provider: str = "none"

    @property
    def has_admin_role(self) -> bool:
        return any(role in ("admin", "administrator") for role in self.roles)

    @property
    def has_worker_role(self) -> bool:
        return "worker" in self.roles
