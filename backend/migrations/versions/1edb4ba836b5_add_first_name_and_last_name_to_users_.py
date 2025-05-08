"""Add first_name and last_name to users table

Revision ID: 1edb4ba836b5
Revises: 305375da9667
Create Date: 2025-05-08 11:00:15.080223

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1edb4ba836b5'
down_revision: Union[str, None] = '305375da9667'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add first_name and last_name columns to users table
    op.add_column('users', sa.Column('first_name', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(50), nullable=True))


def downgrade() -> None:
    # Remove the columns if we need to roll back
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
