"""Initial sync schema.

Revision ID: 0001
Revises:
Create Date: 2026-08-02
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "server_facilities",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("organisation_id", sa.String(length=64), nullable=False),
        sa.Column("district", sa.String(length=128)),
        sa.Column("region", sa.String(length=128)),
        sa.Column("facility_type", sa.String(length=64)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
    )
    op.create_index(
        "ix_server_facilities_organisation_id", "server_facilities", ["organisation_id"]
    )

    op.create_table(
        "server_accounts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("remote_subject", sa.String(length=255), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=64), nullable=False),
        sa.Column("organisation_id", sa.String(length=64), nullable=False),
        sa.Column(
            "facility_id",
            sa.String(length=64),
            sa.ForeignKey("server_facilities.id"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
    )
    op.create_index("ix_server_accounts_organisation_id", "server_accounts", ["organisation_id"])
    op.create_index("ix_server_accounts_facility_id", "server_accounts", ["facility_id"])

    op.create_table(
        "registered_devices",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "account_id", sa.String(length=64), sa.ForeignKey("server_accounts.id"), nullable=False
        ),
        sa.Column("user_agent", sa.String(length=512)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_registered_devices_account_id", "registered_devices", ["account_id"])

    op.create_table(
        "sync_records",
        sa.Column("entity_type", sa.String(length=64), primary_key=True),
        sa.Column("entity_id", sa.String(length=64), primary_key=True),
        sa.Column("organisation_id", sa.String(length=64), nullable=False),
        sa.Column("facility_id", sa.String(length=64), nullable=False),
        sa.Column("owner_account_id", sa.String(length=64), nullable=False),
        sa.Column("server_version", sa.Integer(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
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
        sa.Column("updated_by_account_id", sa.String(length=64), nullable=False),
        sa.UniqueConstraint("entity_type", "entity_id", name="uq_sync_record"),
    )
    op.create_index("ix_sync_records_organisation_id", "sync_records", ["organisation_id"])
    op.create_index("ix_sync_records_facility_id", "sync_records", ["facility_id"])
    op.create_index("ix_sync_records_owner_account_id", "sync_records", ["owner_account_id"])

    op.create_table(
        "sync_operations",
        sa.Column("operation_id", sa.String(length=64), primary_key=True),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("device_id", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("operation", sa.String(length=32), nullable=False),
        sa.Column("request_hash", sa.String(length=128), nullable=False),
        sa.Column("server_version", sa.Integer()),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("conflict_id", sa.String(length=64)),
        sa.Column("error_code", sa.String(length=64)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_sync_operations_account_id", "sync_operations", ["account_id"])

    op.create_table(
        "sync_changes",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("operation", sa.String(length=32), nullable=False),
        sa.Column("server_version", sa.Integer(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("organisation_id", sa.String(length=64), nullable=False),
        sa.Column("facility_id", sa.String(length=64), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("actor_account_id", sa.String(length=64), nullable=False),
    )
    op.create_index("ix_sync_changes_entity_type", "sync_changes", ["entity_type"])
    op.create_index("ix_sync_changes_entity_id", "sync_changes", ["entity_id"])
    op.create_index("ix_sync_changes_organisation_id", "sync_changes", ["organisation_id"])
    op.create_index("ix_sync_changes_facility_id", "sync_changes", ["facility_id"])

    op.create_table(
        "sync_conflicts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("organisation_id", sa.String(length=64), nullable=False),
        sa.Column("facility_id", sa.String(length=64), nullable=False),
        sa.Column("client_operation_id", sa.String(length=64), nullable=False),
        sa.Column("base_server_version", sa.Integer()),
        sa.Column("server_version", sa.Integer(), nullable=False),
        sa.Column("client_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("server_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("conflict_class", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("resolution", sa.String(length=64)),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_sync_conflicts_entity_type", "sync_conflicts", ["entity_type"])
    op.create_index("ix_sync_conflicts_entity_id", "sync_conflicts", ["entity_id"])
    op.create_index("ix_sync_conflicts_account_id", "sync_conflicts", ["account_id"])


def downgrade() -> None:
    op.drop_table("sync_conflicts")
    op.drop_table("sync_changes")
    op.drop_table("sync_operations")
    op.drop_table("sync_records")
    op.drop_table("registered_devices")
    op.drop_table("server_accounts")
    op.drop_table("server_facilities")
