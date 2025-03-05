from typing import Optional, List, Dict, Union
from pydantic import BaseModel, Field
from datetime import datetime, date
from enum import Enum


class TransactionTypeEnum(str, Enum):
    PAWN = "pawn"
    REDEMPTION = "redemption"
    SALE = "sale"
    PAYMENT = "payment"
    EXTENSION = "extension"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"


class TransactionStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethodEnum(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_PAYMENT = "mobile_payment"
    CHECK = "check"
    OTHER = "other"


class TransactionBase(BaseModel):
    """Base schema for transactions"""
    transaction_type: TransactionTypeEnum
    amount: float
    payment_method: PaymentMethodEnum
    status: TransactionStatusEnum = TransactionStatusEnum.PENDING
    reference_number: Optional[str] = None
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    loan_id: Optional[int] = None
    item_id: Optional[int] = None
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    transaction_date: datetime = Field(default_factory=datetime.utcnow)


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    amount: Optional[float] = None
    payment_method: Optional[PaymentMethodEnum] = None
    status: Optional[TransactionStatusEnum] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class Transaction(TransactionBase):
    """Schema for transaction response"""
    id: int
    transaction_code: str
    transaction_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class TransactionWithDetails(Transaction):
    """Schema for transaction with related details"""
    customer_name: Optional[str] = None
    employee_name: Optional[str] = None
    loan_code: Optional[str] = None
    item_name: Optional[str] = None


class TransactionSearchParams(BaseModel):
    """Schema for transaction search parameters"""
    search_term: Optional[str] = Field(None, description="Search by transaction code or reference number")
    transaction_type: Optional[TransactionTypeEnum] = None
    status: Optional[TransactionStatusEnum] = None
    payment_method: Optional[PaymentMethodEnum] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    loan_id: Optional[int] = None
    item_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TransactionStats(BaseModel):
    """Schema for transaction statistics"""
    total_transactions: int
    total_amount: float
    transactions_by_type: Dict[str, int]
    transactions_by_status: Dict[str, int]
    transactions_by_payment_method: Dict[str, int]
    daily_transactions: List[Dict[str, Union[str, int, float]]]
    monthly_transactions: List[Dict[str, Union[str, int, float]]] 