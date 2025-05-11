"""
Utility functions for user service.
"""

from typing import Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.users import User, Role, Permission
from app.schemas.users import UserResponse


async def get_current_user_role(db: AsyncSession, user: User) -> Optional[dict]:
    """Get the current user's role information."""
    if user.role_id:
        # Fetch the role explicitly to avoid relationship loading issues
        result = await db.execute(select(Role).where(Role.id == user.role_id))
        role = result.scalar_one_or_none()
        if role:
            return {
                "id": role.id,
                "name": role.name,
                "description": role.description
            }
    return None


async def get_role_permissions(db: AsyncSession, role_id: int) -> list:
    """Get all permissions for a role."""
    # Fetch the role with its permissions
    result = await db.execute(
        select(Role).where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()

    if not role:
        return []

    # Fetch permissions explicitly
    stmt = select(Permission).join(
        Role.permissions
    ).where(Role.id == role_id)

    result = await db.execute(stmt)
    permissions = result.scalars().all()

    return [
        {
            "id": perm.id,
            "name": perm.name,
            "description": perm.description
        }
        for perm in permissions
    ]


async def validate_user_permissions(db: AsyncSession, user: User, required_permissions: list) -> bool:
    """Validate if user has required permissions."""
    if user.is_superuser:
        return True

    if not user.role_id:
        return False

    # Get permissions for this role
    permissions = await get_role_permissions(db, user.role_id)
    user_permission_names = [perm["name"] for perm in permissions]

    return all(perm in user_permission_names for perm in required_permissions)


async def create_user_response(db: AsyncSession, user: User) -> UserResponse:
    """Create a user response with role information."""
    # Create a dictionary from the user object
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "role_id": user.role_id,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }

    # Create the response from the dictionary
    response = UserResponse.model_validate(user_dict)

    # Add role information
    response.role = await get_current_user_role(db, user)

    return response
