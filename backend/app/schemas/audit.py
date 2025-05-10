from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AuditLogBase(BaseModel):
    """Base audit log schema"""
    action: str
    resource_type: str
    resource_id: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    """Schema for creating an audit log"""
    user_id: int


class AuditLogFilter(BaseModel):
    """Schema for filtering audit logs"""
    user_id: Optional[int] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AuditLog(AuditLogBase):
    """Schema for returning audit log data"""
    id: int
    user_id: int
    timestamp: datetime
    user: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(AuditLog):
    """Schema for returning audit log data in API responses"""
    pass
