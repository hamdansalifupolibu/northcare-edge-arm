"""Add community_requests table for NorthCare Reach R2.

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-03
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CATEGORIES = (
    "pregnancyNewborn",
    "childHealth",
    "nutrition",
    "generalChps",
    "referralFollowUp",
    "emergency",
)
_REQUEST_TYPES = ("routine", "urgentContact", "emergencyAssistance")
_STATUSES = (
    "received",
    "assigned",
    "acknowledged",
    "contactAttempted",
    "escalated",
    "handled",
    "cancelled",
)
_CHANNELS = ("ussdSimulator",)


def upgrade() -> None:
    op.create_table(
        "community_requests",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("reference_code", sa.String(length=32), nullable=False),
        sa.Column("status_pin_hash", sa.Text(), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("request_type", sa.String(length=64), nullable=False),
        sa.Column("contact_number", sa.String(length=20), nullable=False),
        sa.Column("community_or_landmark", sa.String(length=200), nullable=False),
        sa.Column("preferred_language", sa.String(length=16), nullable=False),
        sa.Column("consent_to_contact", sa.Boolean(), nullable=False),
        sa.Column("consent_to_share_location", sa.Boolean(), nullable=False),
        sa.Column("organisation_id", sa.String(length=64), nullable=False),
        sa.Column("facility_id", sa.String(length=64), nullable=False),
        sa.Column("assigned_worker_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "failed_status_lookup_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("status_lookup_locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["facility_id"], ["server_facilities.id"]),
        sa.ForeignKeyConstraint(["assigned_worker_id"], ["server_accounts.id"]),
        sa.UniqueConstraint("reference_code", name="uq_community_requests_reference_code"),
        sa.CheckConstraint(
            "channel IN (" + ", ".join(f"'{value}'" for value in _CHANNELS) + ")",
            name="ck_community_requests_channel",
        ),
        sa.CheckConstraint(
            "category IN (" + ", ".join(f"'{value}'" for value in _CATEGORIES) + ")",
            name="ck_community_requests_category",
        ),
        sa.CheckConstraint(
            "request_type IN (" + ", ".join(f"'{value}'" for value in _REQUEST_TYPES) + ")",
            name="ck_community_requests_request_type",
        ),
        sa.CheckConstraint(
            "status IN (" + ", ".join(f"'{value}'" for value in _STATUSES) + ")",
            name="ck_community_requests_status",
        ),
        sa.CheckConstraint("version >= 1", name="ck_community_requests_version"),
        sa.CheckConstraint(
            "failed_status_lookup_count >= 0",
            name="ck_community_requests_failed_lookup_count",
        ),
        sa.CheckConstraint(
            "length(btrim(contact_number)) > 0 AND length(contact_number) <= 20",
            name="ck_community_requests_contact_number",
        ),
        sa.CheckConstraint(
            "length(btrim(community_or_landmark)) > 0 "
            "AND length(community_or_landmark) <= 200",
            name="ck_community_requests_landmark",
        ),
    )
    op.create_index(
        "ix_community_requests_organisation_facility_status",
        "community_requests",
        ["organisation_id", "facility_id", "status"],
    )
    op.create_index(
        "ix_community_requests_assigned_worker_id",
        "community_requests",
        ["assigned_worker_id"],
    )
    op.create_index("ix_community_requests_category", "community_requests", ["category"])


def downgrade() -> None:
    op.drop_index("ix_community_requests_category", table_name="community_requests")
    op.drop_index(
        "ix_community_requests_assigned_worker_id",
        table_name="community_requests",
    )
    op.drop_index(
        "ix_community_requests_organisation_facility_status",
        table_name="community_requests",
    )
    op.drop_table("community_requests")
