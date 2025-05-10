"""
User service for handling business logic related to users, roles, and permissions.
"""

from typing import Any, List, Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Request

from app.services.audit.service import audit_service

from app.models.users import User, Role, Permission
from app.schemas.users import (
    UserCreate,
    UserUpdate,
    UserFilter,
    RoleCreate,
    RoleUpdate,
    PermissionCreate,
    PermissionUpdate
)


class UserService:
    """Service class for user management."""

    async def get_users(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        filters: UserFilter = None
    ) -> List[User]:
        """Retrieve users with filtering options."""
        query = select(User).offset(skip).limit(limit)

        if filters:
            if filters.first_name:
                query = query.where(User.first_name.ilike(f"%{filters.first_name}%"))
            if filters.last_name:
                query = query.where(User.last_name.ilike(f"%{filters.last_name}%"))
            if filters.email:
                query = query.where(User.email.ilike(f"%{filters.email}%"))
            if filters.username:
                query = query.where(User.username.ilike(f"%{filters.username}%"))
            if filters.role_id:
                query = query.where(User.role_id == filters.role_id)
            if filters.is_active is not None:
                query = query.where(User.is_active == filters.is_active)

        result = await db.execute(query)
        return result.scalars().all()

    async def create_user(
        self,
        db: AsyncSession,
        user_in: UserCreate
    ) -> User:
        """Create a new user with role assignment."""
        # Check if email already exists
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalar_one_or_none():
            raise ValueError("User with this email already exists")

        # Validate role exists
        result = await db.execute(select(Role).where(Role.id == user_in.role_id))
        if not result.scalar_one_or_none():
            raise ValueError(f"Role with id {user_in.role_id} does not exist")

        # Create new user
        db_user = User(
            email=user_in.email,
            username=user_in.username,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            is_active=user_in.is_active,
            is_superuser=user_in.is_superuser,
            role_id=user_in.role_id
        )

        db_user.set_password(user_in.password)
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    async def get_user_by_id(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Optional[User]:
        """Get a specific user by id."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update_user(
        self,
        db: AsyncSession,
        user: User,
        user_in: UserUpdate
    ) -> User:
        """Update a user with role management."""
        # Update user fields
        if user_in.email is not None:
            user.email = user_in.email
        if user_in.username is not None:
            user.username = user_in.username
        if user_in.password is not None:
            user.set_password(user_in.password)
        if user_in.first_name is not None:
            user.first_name = user_in.first_name
        if user_in.last_name is not None:
            user.last_name = user_in.last_name
        if user_in.is_active is not None:
            user.is_active = user_in.is_active
        if user_in.is_superuser is not None:
            user.is_superuser = user_in.is_superuser
        if user_in.role_id is not None:
            # Validate role exists
            result = await db.execute(select(Role).where(Role.id == user_in.role_id))
            if not result.scalar_one_or_none():
                raise ValueError(f"Role with id {user_in.role_id} does not exist")
            user.role_id = user_in.role_id

        user.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)
        return user

    async def delete_user(
        self,
        db: AsyncSession,
        user: User
    ) -> None:
        """Delete a user."""
        if user.is_superuser:
            raise ValueError("Cannot delete superuser")

        await db.delete(user)
        await db.commit()

    async def bulk_update_role(
        self,
        db: AsyncSession,
        user_ids: List[int],
        role_id: int,
        current_user_id: Optional[int] = None,
        request: Optional[Request] = None
    ) -> List[User]:
        """Update role for multiple users at once."""
        # Validate role exists
        result = await db.execute(select(Role).where(Role.id == role_id))
        role = result.scalar_one_or_none()
        if not role:
            raise ValueError(f"Role with id {role_id} does not exist")

        # Get all users
        result = await db.execute(select(User).where(User.id.in_(user_ids)))
        users = result.scalars().all()

        if not users:
            raise ValueError("No users found with the provided IDs")

        # Update role for each user
        updated_users = []
        for user in users:
            # Skip superusers if trying to change their role
            if user.is_superuser:
                continue

            # Store original role for audit log
            original_role_id = user.role_id

            user.role_id = role_id
            user.updated_at = datetime.now(timezone.utc)
            updated_users.append(user)

            # Log the action for each user
            if current_user_id:
                await audit_service.log_action(
                    db=db,
                    user_id=current_user_id,
                    action="update",
                    resource_type="user_role",
                    resource_id=str(user.id),
                    details=f"Updated user role: {user.username}, role_id: {original_role_id} -> {role_id}",
                    request=request
                )

        await db.commit()
        return updated_users


class RoleService:
    """Service class for role management."""

    async def get_roles(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Role]:
        """Retrieve roles with permission information."""
        query = select(Role).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create_role(
        self,
        db: AsyncSession,
        role_in: RoleCreate,
        current_user_id: Optional[int] = None,
        request: Optional[Request] = None
    ) -> Role:
        """Create a new role with permission assignment."""
        # Check if role name already exists
        result = await db.execute(select(Role).where(Role.name == role_in.name))
        if result.scalar_one_or_none():
            raise ValueError("Role with this name already exists")

        # Create new role
        db_role = Role(
            name=role_in.name,
            description=role_in.description
        )
        db.add(db_role)
        await db.commit()
        await db.refresh(db_role)

        # Log the action
        if current_user_id:
            await audit_service.log_action(
                db=db,
                user_id=current_user_id,
                action="create",
                resource_type="role",
                resource_id=str(db_role.id),
                details=f"Created role: {db_role.name}",
                request=request
            )

        return db_role

    async def get_role_by_id(
        self,
        db: AsyncSession,
        role_id: int
    ) -> Optional[Role]:
        """Get a specific role by id."""
        result = await db.execute(select(Role).where(Role.id == role_id))
        return result.scalar_one_or_none()

    async def update_role(
        self,
        db: AsyncSession,
        role: Role,
        role_in: RoleUpdate,
        current_user_id: Optional[int] = None,
        request: Optional[Request] = None
    ) -> Role:
        """Update a role with permission management."""
        # Store original values for audit log
        original_name = role.name
        original_description = role.description

        # Update role fields
        if role_in.name is not None:
            # Check if new name already exists
            if role_in.name != role.name:
                result = await db.execute(select(Role).where(Role.name == role_in.name))
                if result.scalar_one_or_none():
                    raise ValueError("Role with this name already exists")
            role.name = role_in.name

        if role_in.description is not None:
            role.description = role_in.description

        role.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(role)

        # Log the action
        if current_user_id:
            changes = []
            if original_name != role.name:
                changes.append(f"name: {original_name} -> {role.name}")
            if original_description != role.description:
                changes.append(f"description: {original_description} -> {role.description}")

            await audit_service.log_action(
                db=db,
                user_id=current_user_id,
                action="update",
                resource_type="role",
                resource_id=str(role.id),
                details=f"Updated role: {', '.join(changes)}",
                request=request
            )

        return role

    async def delete_role(
        self,
        db: AsyncSession,
        role: Role,
        current_user_id: Optional[int] = None,
        request: Optional[Request] = None
    ) -> None:
        """Delete a role."""
        # Prevent deletion of default roles
        if role.name in ["superuser", "admin", "user"]:
            raise ValueError("Cannot delete default role")

        # Check if any users are assigned to this role
        result = await db.execute(select(User).where(User.role_id == role.id))
        if result.scalars().all():
            raise ValueError("Cannot delete role that is assigned to users")

        role_id = role.id
        role_name = role.name

        await db.delete(role)
        await db.commit()

        # Log the action
        if current_user_id:
            await audit_service.log_action(
                db=db,
                user_id=current_user_id,
                action="delete",
                resource_type="role",
                resource_id=str(role_id),
                details=f"Deleted role: {role_name}",
                request=request
            )


class PermissionService:
    """Service class for permission management."""

    async def get_permissions(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Permission]:
        """Retrieve permissions."""
        query = select(Permission).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create_permission(
        self,
        db: AsyncSession,
        permission_in: PermissionCreate,
        current_user_id: Optional[int] = None,
        request: Optional[Request] = None
    ) -> Permission:
        """Create a new permission."""
        # Check if permission name already exists
        result = await db.execute(select(Permission).where(Permission.name == permission_in.name))
        if result.scalar_one_or_none():
            raise ValueError("Permission with this name already exists")

        # Create new permission
        db_permission = Permission(
            name=permission_in.name,
            description=permission_in.description
        )
        db.add(db_permission)
        await db.commit()
        await db.refresh(db_permission)

        # Log the action
        if current_user_id:
            await audit_service.log_action(
                db=db,
                user_id=current_user_id,
                action="create",
                resource_type="permission",
                resource_id=str(db_permission.id),
                details=f"Created permission: {db_permission.name}",
                request=request
            )

        return db_permission

    async def get_permission_by_id(
        self,
        db: AsyncSession,
        permission_id: int
    ) -> Optional[Permission]:
        """Get a specific permission by id."""
        result = await db.execute(select(Permission).where(Permission.id == permission_id))
        return result.scalar_one_or_none()

    async def update_permission(
        self,
        db: AsyncSession,
        permission: Permission,
        permission_in: PermissionUpdate,
        current_user_id: Optional[int] = None,
        request: Optional[Request] = None
    ) -> Permission:
        """Update a permission."""
        # Store original values for audit log
        original_name = permission.name
        original_description = permission.description

        # Update permission fields
        if permission_in.name is not None:
            # Check if new name already exists
            if permission_in.name != permission.name:
                result = await db.execute(select(Permission).where(Permission.name == permission_in.name))
                if result.scalar_one_or_none():
                    raise ValueError("Permission with this name already exists")
            permission.name = permission_in.name

        if permission_in.description is not None:
            permission.description = permission_in.description

        permission.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(permission)

        # Log the action
        if current_user_id:
            changes = []
            if original_name != permission.name:
                changes.append(f"name: {original_name} -> {permission.name}")
            if original_description != permission.description:
                changes.append(f"description: {original_description} -> {permission.description}")

            await audit_service.log_action(
                db=db,
                user_id=current_user_id,
                action="update",
                resource_type="permission",
                resource_id=str(permission.id),
                details=f"Updated permission: {', '.join(changes)}",
                request=request
            )

        return permission

    async def delete_permission(
        self,
        db: AsyncSession,
        permission: Permission,
        current_user_id: Optional[int] = None,
        request: Optional[Request] = None
    ) -> None:
        """Delete a permission."""
        # Check if any roles are using this permission
        result = await db.execute(select(Role).where(Role.permissions.any(Permission.id == permission.id)))
        if result.scalars().all():
            raise ValueError("Cannot delete permission that is assigned to roles")

        permission_id = permission.id
        permission_name = permission.name

        await db.delete(permission)
        await db.commit()

        # Log the action
        if current_user_id:
            await audit_service.log_action(
                db=db,
                user_id=current_user_id,
                action="delete",
                resource_type="permission",
                resource_id=str(permission_id),
                details=f"Deleted permission: {permission_name}",
                request=request
            )

# Create service instances
user_service = UserService()
role_service = RoleService()
permission_service = PermissionService()
