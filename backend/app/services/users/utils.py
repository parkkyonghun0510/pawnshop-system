"""
Utility functions for user service.
"""

from typing import Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.users import User, Role, Permission
from app.schemas.users import UserResponse


def get_current_user_role(user: User) -> Optional[dict]:
    """Get the current user's role information."""
    if user.role:
        return {
            "id": user.role.id,
            "name": user.role.name,
            "description": user.role.description
        }
    return None


def get_role_permissions(role: Role) -> list:
    """Get all permissions for a role."""
    return [
        {
            "id": perm.id,
            "name": perm.name,
            "description": perm.description
        }
        for perm in role.permissions
    ]


def validate_user_permissions(user: User, required_permissions: list) -> bool:
    """Validate if user has required permissions."""
    if user.is_superuser:
        return True
        
    if not user.role:
        return False
        
    user_permissions = [perm.name for perm in user.role.permissions]
    return all(perm in user_permissions for perm in required_permissions)


def create_user_response(user: User) -> UserResponse:
    """Create a user response with role information."""
    response = UserResponse.from_orm(user)
    response.role = get_current_user_role(user)
    return response
