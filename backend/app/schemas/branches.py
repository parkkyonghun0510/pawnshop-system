from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BranchBase(BaseModel):
    """Base branch schema"""
    name: str
    address: str
    city: str
    state: str
    phone: str
    email: Optional[str] = None
    is_active: bool = True

class BranchCreate(BranchBase):
    """Schema for creating a branch"""
    pass

class BranchUpdate(BaseModel):
    """Schema for updating a branch"""
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

class BranchResponse(BranchBase):
    """Schema for returning branch data"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True) 