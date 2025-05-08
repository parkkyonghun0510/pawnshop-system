"""Add a column

Revision ID: 7e5807d46fec
Revises: 21e27193f488
Create Date: 2025-05-08 12:25:53.185371

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e5807d46fec'
down_revision: Union[str, None] = '21e27193f488'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
