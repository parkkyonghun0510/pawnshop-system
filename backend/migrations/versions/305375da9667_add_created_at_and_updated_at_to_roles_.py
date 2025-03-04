"""Add created_at and updated_at to roles table

Revision ID: 305375da9667
Revises: 037586bae455
Create Date: 2024-03-04 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func


# revision identifiers, used by Alembic.
revision: str = '305375da9667'
down_revision: Union[str, None] = '037586bae455'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding them
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('roles')]
    
    if 'created_at' not in columns:
        op.add_column('roles', sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False))
    if 'updated_at' not in columns:
        op.add_column('roles', sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now(), nullable=True))


def downgrade() -> None:
    # Check if columns exist before dropping them
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('roles')]
    
    if 'updated_at' in columns:
        op.drop_column('roles', 'updated_at')
    if 'created_at' in columns:
        op.drop_column('roles', 'created_at')
