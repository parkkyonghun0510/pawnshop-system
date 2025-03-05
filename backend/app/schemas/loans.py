from typing import Optional, List, Dict, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime, date
from enum import Enum


class LoanStatusEnum(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    OVERDUE = "overdue"
    COMPLETED = "completed"
    DEFAULTED = "defaulted"
    EXTENDED = "extended"
    CANCELLED = "cancelled"


class PaymentMethodEnum(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_PAYMENT = "mobile_payment"
    CHECK = "check"
    OTHER = "other"


class PaymentBase(BaseModel):
    """Base schema for loan payments"""
    amount: float
    payment_date: datetime
    payment_method: PaymentMethodEnum
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Schema for creating a payment"""
    pass


class PaymentUpdate(BaseModel):
    """Schema for updating a payment"""
    amount: Optional[float] = None
    payment_date: Optional[datetime] = None
    payment_method: Optional[PaymentMethodEnum] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class Payment(PaymentBase):
    """Schema for payment response"""
    id: int
    loan_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class LoanBase(BaseModel):
    """Base schema for loans"""
    customer_id: int
    item_id: int
    loan_amount: float
    interest_rate: float
    term_days: int
    start_date: date
    due_date: date
    status: LoanStatusEnum = LoanStatusEnum.PENDING
    collateral_description: Optional[str] = None
    notes: Optional[str] = None


class LoanCreate(LoanBase):
    """Schema for creating a loan"""
    initial_payment: Optional[PaymentCreate] = None


class LoanUpdate(BaseModel):
    """Schema for updating a loan"""
    loan_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    term_days: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[LoanStatusEnum] = None
    collateral_description: Optional[str] = None
    notes: Optional[str] = None


class LoanExtend(BaseModel):
    """Schema for extending a loan"""
    additional_days: int
    payment: Optional[PaymentCreate] = None
    notes: Optional[str] = None


class LoanRedeem(BaseModel):
    """Schema for redeeming a loan"""
    payment: PaymentCreate
    notes: Optional[str] = None


class LoanDefault(BaseModel):
    """Schema for defaulting a loan"""
    default_date: date = Field(default_factory=date.today)
    reason: Optional[str] = None
    notes: Optional[str] = None


class Loan(LoanBase):
    """Schema for loan response"""
    id: int
    loan_code: str
    total_paid: float = 0
    remaining_balance: float = 0
    is_overdue: bool = False
    days_remaining: int = 0
    days_overdue: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    payments: List[Payment] = []
    
    class Config:
        orm_mode = True


class LoanWithDetails(Loan):
    """Schema for loan with customer and item details"""
    customer_name: str
    customer_phone: str
    item_name: str
    item_category: str


class LoanSearchParams(BaseModel):
    """Schema for loan search parameters"""
    search_term: Optional[str] = Field(None, description="Search by loan code or notes")
    status: Optional[LoanStatusEnum] = None
    customer_id: Optional[int] = None
    item_id: Optional[int] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    start_date_from: Optional[date] = None
    start_date_to: Optional[date] = None
    due_date_from: Optional[date] = None
    due_date_to: Optional[date] = None
    is_overdue: Optional[bool] = None


class LoanStats(BaseModel):
    """Schema for loan statistics"""
    total_loans: int
    active_loans: int
    completed_loans: int
    defaulted_loans: int
    overdue_loans: int
    total_loan_amount: float
    total_interest_earned: float
    avg_loan_amount: float
    avg_loan_term: float
    loans_by_status: Dict[str, int]
    loans_by_month: List[Dict[str, Union[str, int, float]]] 