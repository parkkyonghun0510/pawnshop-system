"""
Initialize default roles and permissions.
"""

from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.users import User, Role, Permission
from app.services.users.service import role_service, permission_service


def get_default_roles() -> List[dict]:
    """Get default roles with their permissions."""
    return [
        {
            "name": "superuser",
            "description": "Full system access",
            "permissions": [
                "manage_users",
                "manage_roles",
                "manage_permissions",
                "manage_system"
            ]
        },
        {
            "name": "admin",
            "description": "Administrative access",
            "permissions": [
                "manage_users",
                "manage_roles",
                "manage_permissions"
            ]
        },
        {
            "name": "user",
            "description": "Basic user access",
            "permissions": []
        }
    ]


def get_default_permissions() -> List[dict]:
    """Get default permissions."""
    return [
        {
            "name": "manage_users",
            "description": "Can manage users"
        },
        {
            "name": "manage_roles",
            "description": "Can manage roles"
        },
        {
            "name": "manage_permissions",
            "description": "Can manage permissions"
        },
        {
            "name": "manage_system",
            "description": "Can manage system settings"
        }
    ]


async def initialize_default_roles_and_permissions(db: AsyncSession) -> None:
    """Initialize default roles and permissions."""
    # Create default permissions
    for permission_data in get_default_permissions():
        try:
            await permission_service.create_permission(db, PermissionCreate(**permission_data))
        except ValueError:
            # Permission already exists, skip
            continue
    
    # Create default roles and assign permissions
    for role_data in get_default_roles():
        try:
            role = await role_service.create_role(db, RoleCreate(
                name=role_data["name"],
                description=role_data["description"]
            ))
            
            # Assign permissions to role
            for permission_name in role_data["permissions"]:
                result = await db.execute(
                    select(Permission).where(Permission.name == permission_name)
                )
                permission = result.scalar_one_or_none()
                if permission:
                    role.permissions.append(permission)
            
            await db.commit()
        except ValueError:
            # Role already exists, skip
            continue


async def create_default_superuser(db: AsyncSession, email: str, password: str) -> None:
    """Create default superuser."""
    try:
        # Get superuser role
        result = await db.execute(select(Role).where(Role.name == "superuser"))
        superuser_role = result.scalar_one_or_none()
        
        if not superuser_role:
            raise ValueError("Superuser role not found")
            
        # Create superuser
        await user_service.create_user(
            db,
            UserCreate(
                email=email,
                username="admin",
                password=password,
                first_name="Admin",
                last_name="User",
                is_active=True,
                is_superuser=True,
                role_id=superuser_role.id
            )
        )
    except ValueError:
        # Superuser already exists, skip
        pass
