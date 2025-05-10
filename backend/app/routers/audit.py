from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_db
from app.models.users import User
from app.schemas.audit import AuditLog as AuditLogSchema, AuditLogFilter
from app.core.security import get_current_user_with_cookie, get_current_active_superuser_with_cookie
from app.services.audit.service import audit_service

router = APIRouter()


@router.get("/", response_model=List[AuditLogSchema])
async def read_audit_logs(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_superuser_with_cookie),
    skip: int = 0,
    limit: int = 100,
    filters: AuditLogFilter = Depends()
) -> Any:
    """
    Retrieve audit logs with filtering options.
    Only accessible by superusers.
    """
    audit_logs = await audit_service.get_audit_logs(db, skip, limit, filters)
    return audit_logs


@router.get("/{audit_log_id}", response_model=AuditLogSchema)
async def read_audit_log_by_id(
    audit_log_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_superuser_with_cookie)
) -> Any:
    """
    Get a specific audit log by id.
    Only accessible by superusers.
    """
    audit_log = await audit_service.get_audit_log_by_id(db, audit_log_id)
    if not audit_log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )
    
    return audit_log
