"""Add first_name, last_name, and is_superuser columns to users table

Revision ID: 2328149e0463
Revises: 7e5807d46fec
Create Date: 2025-05-08 14:33:24.799102

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2328149e0463'
down_revision: Union[str, None] = '7e5807d46fec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add first_name, last_name, and is_superuser columns to users table
    op.add_column('users', sa.Column('first_name', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), nullable=True))


def downgrade() -> None:
    # Remove first_name, last_name, and is_superuser columns from users table
    op.drop_column('users', 'is_superuser')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
