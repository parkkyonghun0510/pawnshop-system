from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class CustomerBase(BaseModel):
    """Base customer schema"""
    customer_code: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    notes: Optional[str] = None
    

class CustomerCreate(CustomerBase):
    """Schema for creating a customer"""
    pass


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Customer(CustomerBase):
    """Schema for customer response"""
    id: int
    customer_code: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class CustomerInDB(Customer):
    """Schema for customer in database"""
    pass


class CustomerSearchParams(BaseModel):
    """Schema for customer search parameters"""
    search_term: Optional[str] = Field(None, description="Search by name, email, phone, or customer code")
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    customer_code: Optional[str] = None
    is_active: Optional[bool] = None
    city: Optional[str] = None
    state: Optional[str] = None
    
    
class CustomerStats(BaseModel):
    """Schema for customer statistics"""
    total_customers: int
    active_customers: int
    inactive_customers: int
    customers_with_active_loans: int
    customers_with_completed_loans: int
    customers_with_defaulted_loans: int
    new_customers_this_month: int
    new_customers_this_year: int
    top_customers_by_loan_count: List[Customer]
    top_customers_by_loan_amount: List[Customer] 