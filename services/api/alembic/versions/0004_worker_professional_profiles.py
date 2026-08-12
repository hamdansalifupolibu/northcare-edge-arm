"""Add worker professional profiles for NorthCare Reach R1.

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-03
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_PROFESSIONS = (
    "communityHealthOfficer",
    "communityHealthNurse",
    "registeredGeneralNurse",
    "midwife",
    "nutritionOfficer",
    "physicianAssistant",
    "emergencyMedicalTechnician",
    "otherApprovedHealthProfessional",
)


def upgrade() -> None:
    op.create_table(
        "worker_professional_profiles",
        sa.Column("account_id", sa.String(length=64), primary_key=True),
        sa.Column("profession", sa.String(length=64), nullable=False),
        sa.Column("other_profession_description", sa.String(length=120)),
        sa.Column(
            "community_requests_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "emergency_requests_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
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
        sa.ForeignKeyConstraint(["account_id"], ["server_accounts.id"]),
        sa.CheckConstraint(
            "profession IN (" + ", ".join(f"'{value}'" for value in _PROFESSIONS) + ")",
            name="ck_worker_professional_profiles_profession",
        ),
        sa.CheckConstraint(
            "NOT emergency_requests_enabled OR community_requests_enabled",
            name="ck_worker_professional_profiles_emergency_requires_community",
        ),
        sa.CheckConstraint(
            "("
            "profession = 'otherApprovedHealthProfessional' "
            "AND other_profession_description IS NOT NULL "
            "AND length(btrim(other_profession_description)) > 0"
            ") OR ("
            "profession <> 'otherApprovedHealthProfessional' "
            "AND other_profession_description IS NULL"
            ")",
            name="ck_worker_professional_profiles_other_description",
        ),
    )
    op.create_index(
        "ix_worker_professional_profiles_profession",
        "worker_professional_profiles",
        ["profession"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_worker_professional_profiles_profession",
        table_name="worker_professional_profiles",
    )
    op.drop_table("worker_professional_profiles")
