"""empty message

Revision ID: 41c829aa0b03
Revises: a26726d1b6fb
Create Date: 2025-05-08 11:52:29.966414

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '41c829aa0b03'
down_revision: Union[str, None] = 'a26726d1b6fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
