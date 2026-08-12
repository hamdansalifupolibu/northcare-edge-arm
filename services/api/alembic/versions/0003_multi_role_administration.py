"""Multi-role accounts and administration foundations.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-02
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "server_account_roles",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "account_id",
            sa.String(length=64),
            sa.ForeignKey("server_accounts.id"),
            nullable=False,
        ),
        sa.Column("role", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("assigned_by_account_id", sa.String(length=64)),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
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
        sa.UniqueConstraint("account_id", "role", name="uq_server_account_roles_account_role"),
    )
    op.create_index("ix_server_account_roles_account_id", "server_account_roles", ["account_id"])
    op.create_index("ix_server_account_roles_role", "server_account_roles", ["role"])

    op.add_column(
        "server_accounts",
        sa.Column("account_version", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "server_accounts",
        sa.Column(
            "account_status",
            sa.String(length=64),
            nullable=False,
            server_default="active",
        ),
    )
    op.add_column(
        "server_accounts",
        sa.Column("normalised_email", sa.String(length=320)),
    )
    op.add_column(
        "server_accounts",
        sa.Column(
            "first_login_required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "server_accounts",
        sa.Column(
            "identity_provider",
            sa.String(length=64),
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column(
        "server_accounts",
        sa.Column("last_remote_sign_in_at", sa.DateTime(timezone=True)),
    )
    op.create_index(
        "ix_server_accounts_normalised_email",
        "server_accounts",
        ["normalised_email"],
        unique=True,
    )
    op.create_index("ix_server_accounts_organisation_id_status", "server_accounts", [
        "organisation_id",
        "account_status",
    ])

    op.add_column(
        "registered_devices",
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
    )
    op.add_column(
        "registered_devices",
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
    )
    op.add_column(
        "registered_devices",
        sa.Column("platform", sa.String(length=64)),
    )
    op.add_column(
        "registered_devices",
        sa.Column("app_version", sa.String(length=64)),
    )
    op.add_column(
        "registered_devices",
        sa.Column("label", sa.String(length=128)),
    )

    op.create_table(
        "administration_audit_events",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("organisation_id", sa.String(length=64), nullable=False),
        sa.Column("actor_account_id", sa.String(length=64), nullable=False),
        sa.Column("target_account_id", sa.String(length=64)),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("result", sa.String(length=32), nullable=False),
        sa.Column("reason_category", sa.String(length=64)),
        sa.Column(
            "safe_metadata",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_administration_audit_events_org",
        "administration_audit_events",
        ["organisation_id"],
    )
    op.create_index(
        "ix_administration_audit_events_target",
        "administration_audit_events",
        ["target_account_id"],
    )
    op.create_index(
        "ix_administration_audit_events_created",
        "administration_audit_events",
        ["created_at"],
    )

    op.create_table(
        "admin_idempotency_keys",
        sa.Column("idempotency_key", sa.String(length=128), primary_key=True),
        sa.Column("actor_account_id", sa.String(length=64), nullable=False),
        sa.Column("operation", sa.String(length=64), nullable=False),
        sa.Column("request_hash", sa.String(length=128), nullable=False),
        sa.Column("response_json", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # Migrate single-role column into role assignments; map administrator → admin.
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, role, is_active, created_at, updated_at FROM server_accounts")
    ).fetchall()
    for row in rows:
        account_id, legacy_role, is_active, created_at, updated_at = row
        role = "admin" if legacy_role in ("administrator", "admin") else legacy_role
        if role not in ("worker", "admin"):
            role = "worker"
        status = "active" if is_active else "revoked"
        role_id = f"role-{account_id}-{role}"
        conn.execute(
            sa.text(
                """
                INSERT INTO server_account_roles (
                    id, account_id, role, status, assigned_at, created_at, updated_at
                ) VALUES (
                    :id, :account_id, :role, :status, :assigned_at, :created_at, :updated_at
                )
                ON CONFLICT DO NOTHING
                """
            ),
            {
                "id": role_id,
                "account_id": account_id,
                "role": role,
                "status": status,
                "assigned_at": created_at,
                "created_at": created_at,
                "updated_at": updated_at,
            },
        )
        conn.execute(
            sa.text(
                "UPDATE server_accounts SET role = :role, account_status = :account_status "
                "WHERE id = :account_id"
            ),
            {
                "role": role,
                "account_status": "active" if is_active else "inactive",
                "account_id": account_id,
            },
        )

    # Link development credential emails onto accounts when present.
    creds = conn.execute(
        sa.text("SELECT email, account_id FROM development_credentials")
    ).fetchall()
    for email, account_id in creds:
        conn.execute(
            sa.text(
                "UPDATE server_accounts SET normalised_email = :email, "
                "identity_provider = 'development' WHERE id = :account_id "
                "AND normalised_email IS NULL"
            ),
            {"email": email.strip().lower(), "account_id": account_id},
        )


def downgrade() -> None:
    # Restore legacy role strings for sync compatibility.
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE server_accounts SET role = 'administrator' WHERE role = 'admin'"
        )
    )
    op.drop_table("admin_idempotency_keys")
    op.drop_table("administration_audit_events")
    op.drop_column("registered_devices", "label")
    op.drop_column("registered_devices", "app_version")
    op.drop_column("registered_devices", "platform")
    op.drop_column("registered_devices", "revoked_at")
    op.drop_column("registered_devices", "status")
    op.drop_index("ix_server_accounts_organisation_id_status", table_name="server_accounts")
    op.drop_index("ix_server_accounts_normalised_email", table_name="server_accounts")
    op.drop_column("server_accounts", "last_remote_sign_in_at")
    op.drop_column("server_accounts", "identity_provider")
    op.drop_column("server_accounts", "first_login_required")
    op.drop_column("server_accounts", "normalised_email")
    op.drop_column("server_accounts", "account_status")
    op.drop_column("server_accounts", "account_version")
    op.drop_table("server_account_roles")
