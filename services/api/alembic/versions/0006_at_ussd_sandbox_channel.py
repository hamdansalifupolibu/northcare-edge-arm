"""Allow ussdAfricasTalkingSandbox channel for Reach T1 AT USSD.

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-04
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CHANNELS_T1 = ("ussdSimulator", "ussdAfricasTalkingSandbox")
_CHANNELS_R2 = ("ussdSimulator",)


def upgrade() -> None:
    op.drop_constraint("ck_community_requests_channel", "community_requests", type_="check")
    allowed = ", ".join(f"'{value}'" for value in _CHANNELS_T1)
    op.create_check_constraint(
        "ck_community_requests_channel",
        "community_requests",
        f"channel IN ({allowed})",
    )


def downgrade() -> None:
    op.drop_constraint("ck_community_requests_channel", "community_requests", type_="check")
    allowed = ", ".join(f"'{value}'" for value in _CHANNELS_R2)
    op.create_check_constraint(
        "ck_community_requests_channel",
        "community_requests",
        f"channel IN ({allowed})",
    )
