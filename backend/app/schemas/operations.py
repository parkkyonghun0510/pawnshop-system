from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator, ConfigDict
from app.models.operations import ApplicationStatus, ItemCategory
from app.models.loan_application import ApplicationDocumentType

class ApplicationBase(BaseModel):
    customer_id: int
    branch_id: int
    item_category: ItemCategory
    item_description: str
    estimated_value: float = Field(gt=0)
    loan_amount: float = Field(gt=0)
    interest_rate: float = Field(gt=0)
    term_months: int = Field(gt=0)
    notes: Optional[str] = None

    # Additional fields for enhanced loan application
    credit_score: Optional[int] = None
    monthly_income: Optional[float] = None
    employment_status: Optional[str] = None
    employer_name: Optional[str] = None
    employment_duration: Optional[int] = None  # In months
    has_existing_loans: Optional[bool] = False
    existing_loan_amount: Optional[float] = None
    collateral_description: Optional[str] = None
    collateral_condition: Optional[str] = None

    @validator('loan_amount')
    def validate_loan_amount(cls, v, values):
        if 'estimated_value' in values and v > values['estimated_value']:
            raise ValueError('Loan amount cannot exceed estimated value')
        return v

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

    # Additional fields for enhanced loan application
    credit_score: Optional[int] = None
    monthly_income: Optional[float] = None
    employment_status: Optional[str] = None
    employer_name: Optional[str] = None
    employment_duration: Optional[int] = None
    has_existing_loans: Optional[bool] = None
    existing_loan_amount: Optional[float] = None
    collateral_description: Optional[str] = None
    collateral_condition: Optional[str] = None
    appraisal_notes: Optional[str] = None
    risk_assessment: Optional[str] = None
    approval_level: Optional[int] = None
    approved_loan_amount: Optional[float] = None
    approved_interest_rate: Optional[float] = None
    approved_term_days: Optional[int] = None
    decision_notes: Optional[str] = None
    loan_agreement_signed: Optional[bool] = None
    loan_agreement_signed_at: Optional[datetime] = None
    loan_disbursed: Optional[bool] = None
    loan_disbursed_at: Optional[datetime] = None
    loan_id: Optional[int] = None

    @validator('rejection_reason')
    def validate_rejection_reason(cls, v, values):
        if 'status' in values and values['status'] == ApplicationStatus.REJECTED and not v:
            raise ValueError('Rejection reason is required when rejecting an application')
        return v

class ApplicationDocumentBase(BaseModel):
    document_type: ApplicationDocumentType
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    notes: Optional[str] = None

class ApplicationDocumentCreate(ApplicationDocumentBase):
    application_id: int
    uploaded_by_id: int

class ApplicationDocument(ApplicationDocumentBase):
    id: int
    application_id: int
    uploaded_by_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ApplicationReviewBase(BaseModel):
    review_step: str
    status: str
    comments: Optional[str] = None

class ApplicationReviewCreate(ApplicationReviewBase):
    application_id: int
    reviewer_id: int

class ApplicationReview(ApplicationReviewBase):
    id: int
    application_id: int
    reviewer_id: int
    reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Application(ApplicationBase):
    id: int
    application_number: str
    status: ApplicationStatus
    processed_by_id: Optional[int] = None
    processed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Additional fields for enhanced loan application
    appraisal_notes: Optional[str] = None
    risk_assessment: Optional[str] = None
    approval_level: Optional[int] = None
    approved_loan_amount: Optional[float] = None
    approved_interest_rate: Optional[float] = None
    approved_term_days: Optional[int] = None
    decision_notes: Optional[str] = None
    loan_agreement_signed: Optional[bool] = None
    loan_agreement_signed_at: Optional[datetime] = None
    loan_disbursed: Optional[bool] = None
    loan_disbursed_at: Optional[datetime] = None
    loan_id: Optional[int] = None

    created_at: datetime
    updated_at: datetime

    # Relationships
    documents: Optional[List[ApplicationDocument]] = []
    reviews: Optional[List[ApplicationReview]] = []

    model_config = ConfigDict(from_attributes=True)