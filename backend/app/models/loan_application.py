"""
Enhanced loan application model for the pawnshop system.
This module extends the Application model with additional fields and methods.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta
import enum

from app.database import Base
from app.models.operations import Application, ApplicationStatus, ItemCategory


class ApplicationDocumentType(str, enum.Enum):
    """Types of documents that can be attached to a loan application."""
    ID_CARD = "id_card"
    PROOF_OF_INCOME = "proof_of_income"
    PROOF_OF_ADDRESS = "proof_of_address"
    ITEM_PHOTO = "item_photo"
    ITEM_RECEIPT = "item_receipt"
    APPRAISAL_CERTIFICATE = "appraisal_certificate"
    OTHER = "other"


class ApplicationDocument(Base):
    """Documents attached to a loan application."""
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(Enum(ApplicationDocumentType), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String, nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])


class ApplicationReview(Base):
    """Review steps for a loan application."""
    __tablename__ = "application_reviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_step = Column(String, nullable=False)  # e.g., "initial_review", "manager_approval", "final_approval"
    status = Column(String, nullable=False)  # e.g., "pending", "approved", "rejected"
    comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    application = relationship("Application", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])


# Extend the Application model with relationships to the new models
Application.documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
Application.reviews = relationship("ApplicationReview", back_populates="application", cascade="all, delete-orphan")

# Add additional fields to the Application model
# These will be added in the migration
"""
ALTER TABLE applications ADD COLUMN credit_score INTEGER;
ALTER TABLE applications ADD COLUMN monthly_income NUMERIC(10, 2);
ALTER TABLE applications ADD COLUMN employment_status VARCHAR(50);
ALTER TABLE applications ADD COLUMN employer_name VARCHAR(100);
ALTER TABLE applications ADD COLUMN employment_duration INTEGER;  -- In months
ALTER TABLE applications ADD COLUMN has_existing_loans BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN existing_loan_amount NUMERIC(10, 2);
ALTER TABLE applications ADD COLUMN collateral_description TEXT;
ALTER TABLE applications ADD COLUMN collateral_condition VARCHAR(50);
ALTER TABLE applications ADD COLUMN appraisal_notes TEXT;
ALTER TABLE applications ADD COLUMN risk_assessment VARCHAR(20);  -- e.g., "low", "medium", "high"
ALTER TABLE applications ADD COLUMN approval_level INTEGER DEFAULT 1;  -- Number of approvals needed
ALTER TABLE applications ADD COLUMN approved_loan_amount NUMERIC(10, 2);  -- May differ from requested amount
ALTER TABLE applications ADD COLUMN approved_interest_rate NUMERIC(5, 2);  -- May differ from standard rate
ALTER TABLE applications ADD COLUMN approved_term_days INTEGER;  -- May differ from requested term
ALTER TABLE applications ADD COLUMN decision_notes TEXT;
ALTER TABLE applications ADD COLUMN loan_agreement_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN loan_agreement_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN loan_disbursed BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN loan_disbursed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN loan_id INTEGER REFERENCES loans(id);
"""
