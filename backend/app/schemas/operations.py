from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator
from app.models.operations import ApplicationStatus

class ApplicationBase(BaseModel):
    customer_id: int
    branch_id: int
    item_type_id: int
    item_description: str
    estimated_value: float = Field(gt=0)
    loan_amount: float = Field(gt=0)
    interest_rate: float = Field(gt=0)
    term_months: int = Field(gt=0)
    notes: Optional[str] = None

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

    @validator('rejection_reason')
    def validate_rejection_reason(cls, v, values):
        if 'status' in values and values['status'] == ApplicationStatus.REJECTED and not v:
            raise ValueError('Rejection reason is required when rejecting an application')
        return v

class Application(ApplicationBase):
    id: int
    application_number: str
    status: ApplicationStatus
    processed_by_id: Optional[int] = None
    processed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 