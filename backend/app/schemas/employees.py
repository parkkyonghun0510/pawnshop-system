from datetime import datetime, date
from typing import Optional, List, Dict, Union
from enum import Enum
from pydantic import BaseModel, Field

# Employee Type Schemas
class EmployeeTypeBase(BaseModel):
    """Base schema for employee types"""
    name: str
    description: Optional[str] = None


class EmployeeTypeCreate(EmployeeTypeBase):
    """Schema for creating an employee type"""
    pass


class EmployeeTypeUpdate(BaseModel):
    """Schema for updating an employee type"""
    name: Optional[str] = None
    description: Optional[str] = None


class EmployeeType(EmployeeTypeBase):
    """Schema for employee type response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Employee Schemas
class EmployeeBase(BaseModel):
    """Base schema for employees"""
    user_id: int
    branch_id: int
    employee_type_id: int
    hire_date: date


class EmployeeCreate(EmployeeBase):
    """Schema for creating an employee"""
    pass


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee"""
    branch_id: Optional[int] = None
    employee_type_id: Optional[int] = None
    hire_date: Optional[date] = None
    is_active: Optional[bool] = None


class Employee(EmployeeBase):
    """Schema for employee response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class EmployeeWithDetails(Employee):
    """Schema for employee with user, branch and type details"""
    username: str
    email: str
    branch_name: str
    employee_type_name: str
    is_active: bool = True


class EmployeeSearchParams(BaseModel):
    """Schema for employee search parameters"""
    search_term: Optional[str] = Field(None, description="Search by employee name or email")
    branch_id: Optional[int] = None
    employee_type_id: Optional[int] = None
    is_active: Optional[bool] = None
    hire_date_from: Optional[date] = None
    hire_date_to: Optional[date] = None


class EmployeeStats(BaseModel):
    """Schema for employee statistics"""
    total_employees: int
    active_employees: int
    employees_by_branch: Dict[str, int]
    employees_by_type: Dict[str, int]
    employees_by_hire_month: List[Dict[str, Union[str, int]]] 