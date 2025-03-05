from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class EmployeeTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class EmployeeTypeCreate(EmployeeTypeBase):
    pass

class EmployeeTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class EmployeeType(EmployeeTypeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class EmployeeBase(BaseModel):
    user_id: int
    branch_id: int
    employee_type_id: int
    hire_date: datetime

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    user_id: Optional[int] = None
    branch_id: Optional[int] = None
    employee_type_id: Optional[int] = None
    hire_date: Optional[datetime] = None

class Employee(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True) 