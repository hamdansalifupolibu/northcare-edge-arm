from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from northcare_api.database import Base


class ServerFacility(Base):
    __tablename__ = "server_facilities"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    organisation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(128))
    region: Mapped[str | None] = mapped_column(String(128))
    facility_type: Mapped[str | None] = mapped_column(String(64))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ServerAccount(Base):
    __tablename__ = "server_accounts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    remote_subject: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    organisation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    facility_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("server_facilities.id"), nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    account_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    account_status: Mapped[str] = mapped_column(String(64), nullable=False, default="active")
    normalised_email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True)
    first_login_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    identity_provider: Mapped[str] = mapped_column(String(64), nullable=False, default="none")
    last_remote_sign_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ServerAccountRole(Base):
    __tablename__ = "server_account_roles"
    __table_args__ = (
        UniqueConstraint("account_id", "role", name="uq_server_account_roles_account_role"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    account_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("server_accounts.id"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    assigned_by_account_id: Mapped[str | None] = mapped_column(String(64))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class DevelopmentCredential(Base):
    """Development-only password verifier. Plaintext credentials are never persisted."""

    __tablename__ = "development_credentials"

    email: Mapped[str] = mapped_column(String(320), primary_key=True)
    account_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("server_accounts.id"), nullable=False, unique=True, index=True
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    hash_algorithm: Mapped[str] = mapped_column(String(64), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class RegisteredDevice(Base):
    __tablename__ = "registered_devices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    account_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("server_accounts.id"), nullable=False, index=True
    )
    user_agent: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    platform: Mapped[str | None] = mapped_column(String(64))
    app_version: Mapped[str | None] = mapped_column(String(64))
    label: Mapped[str | None] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class WorkerProfessionalProfile(Base):
    """Server-authoritative Reach professional profile (not a system role)."""

    __tablename__ = "worker_professional_profiles"

    account_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("server_accounts.id"), primary_key=True
    )
    profession: Mapped[str] = mapped_column(String(64), nullable=False)
    other_profession_description: Mapped[str | None] = mapped_column(String(120))
    community_requests_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    emergency_requests_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class CommunityRequest(Base):
    """Synthetic NorthCare Reach community request (not a clinical client record)."""

    __tablename__ = "community_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    reference_code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    status_pin_hash: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    request_type: Mapped[str] = mapped_column(String(64), nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    community_or_landmark: Mapped[str] = mapped_column(String(200), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(16), nullable=False)
    consent_to_contact: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_to_share_location: Mapped[bool] = mapped_column(Boolean, nullable=False)
    organisation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    facility_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("server_facilities.id"), nullable=False, index=True
    )
    assigned_worker_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("server_accounts.id"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    failed_status_lookup_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status_lookup_locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AdministrationAuditEvent(Base):
    __tablename__ = "administration_audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organisation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    actor_account_id: Mapped[str] = mapped_column(String(64), nullable=False)
    target_account_id: Mapped[str | None] = mapped_column(String(64), index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    result: Mapped[str] = mapped_column(String(32), nullable=False)
    reason_category: Mapped[str | None] = mapped_column(String(64))
    safe_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


class AdminIdempotencyKey(Base):
    __tablename__ = "admin_idempotency_keys"

    idempotency_key: Mapped[str] = mapped_column(String(128), primary_key=True)
    actor_account_id: Mapped[str] = mapped_column(String(64), nullable=False)
    operation: Mapped[str] = mapped_column(String(64), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    response_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SyncRecord(Base):
    __tablename__ = "sync_records"
    __table_args__ = (UniqueConstraint("entity_type", "entity_id", name="uq_sync_record"),)

    entity_type: Mapped[str] = mapped_column(String(64), primary_key=True)
    entity_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organisation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    facility_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    owner_account_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    server_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    updated_by_account_id: Mapped[str] = mapped_column(String(64), nullable=False)


class SyncOperation(Base):
    __tablename__ = "sync_operations"

    operation_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    account_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    device_id: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    operation: Mapped[str] = mapped_column(String(32), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    server_version: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    conflict_id: Mapped[str | None] = mapped_column(String(64))
    error_code: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SyncChange(Base):
    __tablename__ = "sync_changes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    operation: Mapped[str] = mapped_column(String(32), nullable=False)
    server_version: Mapped[int] = mapped_column(Integer, nullable=False)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    organisation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    facility_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    actor_account_id: Mapped[str] = mapped_column(String(64), nullable=False)


class SyncConflict(Base):
    __tablename__ = "sync_conflicts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    account_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    organisation_id: Mapped[str] = mapped_column(String(64), nullable=False)
    facility_id: Mapped[str] = mapped_column(String(64), nullable=False)
    client_operation_id: Mapped[str] = mapped_column(String(64), nullable=False)
    base_server_version: Mapped[int | None] = mapped_column(Integer)
    server_version: Mapped[int] = mapped_column(Integer, nullable=False)
    client_payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    server_payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    conflict_class: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    resolution: Mapped[str | None] = mapped_column(String(64))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
