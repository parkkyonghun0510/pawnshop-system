"""schema: Add fields to Application model for improved loan workflow

Revision ID: schema_enhance_loan_app
Revises: 2328149e0463
Create Date: 2025-05-10 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'schema_enhance_loan_app'
down_revision: Union[str, None] = '2328149e0463'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create application_document_type enum if it doesn't exist
    connection = op.get_bind()

    # Check if enum type already exists
    result = connection.execute(
        text("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_document_type')")
    ).scalar()

    if not result:
        # Create enum type only if it doesn't exist
        connection.execute(
            text("CREATE TYPE application_document_type AS ENUM ('id_card', 'proof_of_income', 'proof_of_address', 'item_photo', 'item_receipt', 'appraisal_certificate', 'other')")
        )

    # Create application_documents table
    # Use a string type for document_type first, then alter it to use the enum
    op.create_table(
        'application_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(), nullable=False),  # Use String instead of Enum
        sa.Column('file_name', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=False),
        sa.Column('uploaded_by_id', sa.Integer(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Alter the column to use the enum type
    connection.execute(
        text("ALTER TABLE application_documents ALTER COLUMN document_type TYPE application_document_type USING document_type::application_document_type")
    )
    op.create_index(op.f('ix_application_documents_id'), 'application_documents', ['id'], unique=False)

    # Create application_reviews table
    op.create_table(
        'application_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=False),
        sa.Column('review_step', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_application_reviews_id'), 'application_reviews', ['id'], unique=False)

    # Add new columns to applications table
    op.add_column('applications', sa.Column('credit_score', sa.Integer(), nullable=True))
    op.add_column('applications', sa.Column('monthly_income', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('applications', sa.Column('employment_status', sa.String(length=50), nullable=True))
    op.add_column('applications', sa.Column('employer_name', sa.String(length=100), nullable=True))
    op.add_column('applications', sa.Column('employment_duration', sa.Integer(), nullable=True))
    op.add_column('applications', sa.Column('has_existing_loans', sa.Boolean(), server_default=sa.text('false'), nullable=True))
    op.add_column('applications', sa.Column('existing_loan_amount', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('applications', sa.Column('collateral_description', sa.Text(), nullable=True))
    op.add_column('applications', sa.Column('collateral_condition', sa.String(length=50), nullable=True))
    op.add_column('applications', sa.Column('appraisal_notes', sa.Text(), nullable=True))
    op.add_column('applications', sa.Column('risk_assessment', sa.String(length=20), nullable=True))
    op.add_column('applications', sa.Column('approval_level', sa.Integer(), server_default=sa.text('1'), nullable=True))
    op.add_column('applications', sa.Column('approved_loan_amount', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('applications', sa.Column('approved_interest_rate', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('applications', sa.Column('approved_term_days', sa.Integer(), nullable=True))
    op.add_column('applications', sa.Column('decision_notes', sa.Text(), nullable=True))
    op.add_column('applications', sa.Column('loan_agreement_signed', sa.Boolean(), server_default=sa.text('false'), nullable=True))
    op.add_column('applications', sa.Column('loan_agreement_signed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('applications', sa.Column('loan_disbursed', sa.Boolean(), server_default=sa.text('false'), nullable=True))
    op.add_column('applications', sa.Column('loan_disbursed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('applications', sa.Column('loan_id', sa.Integer(), nullable=True))

    # Add foreign key constraint for loan_id
    op.create_foreign_key(None, 'applications', 'loans', ['loan_id'], ['id'])


def downgrade() -> None:
    # Drop foreign key constraint for loan_id
    op.drop_constraint(None, 'applications', type_='foreignkey')

    # Drop added columns from applications table
    op.drop_column('applications', 'loan_id')
    op.drop_column('applications', 'loan_disbursed_at')
    op.drop_column('applications', 'loan_disbursed')
    op.drop_column('applications', 'loan_agreement_signed_at')
    op.drop_column('applications', 'loan_agreement_signed')
    op.drop_column('applications', 'decision_notes')
    op.drop_column('applications', 'approved_term_days')
    op.drop_column('applications', 'approved_interest_rate')
    op.drop_column('applications', 'approved_loan_amount')
    op.drop_column('applications', 'approval_level')
    op.drop_column('applications', 'risk_assessment')
    op.drop_column('applications', 'appraisal_notes')
    op.drop_column('applications', 'collateral_condition')
    op.drop_column('applications', 'collateral_description')
    op.drop_column('applications', 'existing_loan_amount')
    op.drop_column('applications', 'has_existing_loans')
    op.drop_column('applications', 'employment_duration')
    op.drop_column('applications', 'employer_name')
    op.drop_column('applications', 'employment_status')
    op.drop_column('applications', 'monthly_income')
    op.drop_column('applications', 'credit_score')

    # Drop application_reviews table
    op.drop_index(op.f('ix_application_reviews_id'), table_name='application_reviews')
    op.drop_table('application_reviews')

    # Drop application_documents table
    op.drop_index(op.f('ix_application_documents_id'), table_name='application_documents')
    op.drop_table('application_documents')

    # Drop application_document_type enum if it exists
    connection = op.get_bind()

    # Check if enum type exists
    result = connection.execute(
        text("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_document_type')")
    ).scalar()

    if result:
        # Drop enum type only if it exists
        connection.execute(text("DROP TYPE application_document_type"))
