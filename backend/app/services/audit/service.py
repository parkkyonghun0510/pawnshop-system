"""
Audit service for handling business logic related to audit logs.
"""

from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import Request

from app.models.users import AuditLog, User
from app.schemas.audit import AuditLogCreate, AuditLogFilter


class AuditService:
    """Service class for audit log management."""
    
    async def create_audit_log(
        self,
        db: AsyncSession,
        audit_log_in: AuditLogCreate
    ) -> AuditLog:
        """Create a new audit log entry."""
        db_audit_log = AuditLog(
            user_id=audit_log_in.user_id,
            action=audit_log_in.action,
            resource_type=audit_log_in.resource_type,
            resource_id=audit_log_in.resource_id,
            details=audit_log_in.details,
            ip_address=audit_log_in.ip_address,
            user_agent=audit_log_in.user_agent,
            timestamp=datetime.now(timezone.utc)
        )
        
        db.add(db_audit_log)
        await db.commit()
        await db.refresh(db_audit_log)
        return db_audit_log
    
    async def get_audit_logs(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[AuditLogFilter] = None
    ) -> List[AuditLog]:
        """Retrieve audit logs with filtering options."""
        query = select(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
        
        if filters:
            conditions = []
            if filters.user_id:
                conditions.append(AuditLog.user_id == filters.user_id)
            if filters.action:
                conditions.append(AuditLog.action.ilike(f"%{filters.action}%"))
            if filters.resource_type:
                conditions.append(AuditLog.resource_type == filters.resource_type)
            if filters.resource_id:
                conditions.append(AuditLog.resource_id == filters.resource_id)
            if filters.start_date:
                conditions.append(AuditLog.timestamp >= filters.start_date)
            if filters.end_date:
                conditions.append(AuditLog.timestamp <= filters.end_date)
            
            if conditions:
                query = query.where(and_(*conditions))
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_audit_log_by_id(
        self,
        db: AsyncSession,
        audit_log_id: int
    ) -> Optional[AuditLog]:
        """Get a specific audit log by id."""
        result = await db.execute(select(AuditLog).where(AuditLog.id == audit_log_id))
        return result.scalar_one_or_none()
    
    async def log_action(
        self,
        db: AsyncSession,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[str] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """Log an action with request information."""
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
        
        audit_log_in = AuditLogCreate(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return await self.create_audit_log(db, audit_log_in)


audit_service = AuditService()
