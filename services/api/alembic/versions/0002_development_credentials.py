"""Development credential verifier storage.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-02
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "development_credentials",
        sa.Column("email", sa.String(length=320), primary_key=True),
        sa.Column(
            "account_id", sa.String(length=64), sa.ForeignKey("server_accounts.id"), nullable=False
        ),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("hash_algorithm", sa.String(length=64), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("account_id", name="uq_development_credentials_account_id"),
    )
    op.create_index(
        "ix_development_credentials_account_id", "development_credentials", ["account_id"]
    )


def downgrade() -> None:
    op.drop_table("development_credentials")
