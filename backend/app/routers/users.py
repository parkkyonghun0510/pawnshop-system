from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_async_db
from app.models.users import User, Role, Permission
from app.schemas.users import (
    User as UserSchema,
    UserCreate,
    UserUpdate,
    Role as RoleSchema,
    RoleCreate,
    RoleUpdate,
    Permission as PermissionSchema,
    PermissionCreate,
    PermissionUpdate,
    UserResponse,
    UserFilter,
    BulkRoleUpdate
)
from app.core.security import (
    get_current_user_with_cookie,
    get_current_active_superuser_with_cookie,
    get_password_hash
)
from app.services.users.service import user_service, role_service, permission_service
from app.services.users.utils import create_user_response

router = APIRouter()

# --- User Routes ---

@router.get("/", response_model=List[UserResponse])
async def read_users(
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100,
    filters: UserFilter = Depends()
) -> Any:
    """
    Retrieve users with filtering options.
    """
    # Check permissions
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )

    users = await user_service.get_users(db, skip, limit, filters)

    # Create user responses with proper async handling
    user_responses = []
    for user in users:
        user_response = await create_user_response(db, user)
        user_responses.append(user_response)

    return user_responses

@router.post("/", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_active_superuser_with_cookie)
) -> Any:
    """
    Create new user with role assignment.
    """
    try:
        user = await user_service.create_user(db, user_in)
        return await create_user_response(db, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{user_id}", response_model=UserResponse)
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get a specific user by id.
    """
    # Check permissions
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )

    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return await create_user_response(db, user)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update a user with role management.
    """
    # Check permissions
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )

    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    try:
        updated_user = await user_service.update_user(db, user, user_in)
        return await create_user_response(db, updated_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}", response_model=None)
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_active_superuser_with_cookie)
) -> Any:
    """
    Delete a user.
    """
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    try:
        await user_service.delete_user(db, user)
        return None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bulk-update-role", response_model=List[UserResponse])
async def bulk_update_role(
    bulk_update: BulkRoleUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_active_superuser_with_cookie)
) -> Any:
    """
    Update role for multiple users at once.
    """
    try:
        updated_users = await user_service.bulk_update_role(
            db,
            bulk_update.user_ids,
            bulk_update.role_id,
            current_user_id=current_user.id,
            request=request
        )

        # Create user responses with proper async handling
        user_responses = []
        for user in updated_users:
            user_response = await create_user_response(db, user)
            user_responses.append(user_response)

        return user_responses
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Role Routes ---

@router.get("/roles", response_model=List[RoleSchema])
async def read_roles(
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Retrieve roles with permission information.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )

    roles = await role_service.get_roles(db, skip, limit)
    return roles

@router.post("/roles", response_model=RoleSchema)
async def create_role(
    *,
    db: AsyncSession = Depends(get_async_db),
    role_in: RoleCreate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
    request: Request,
) -> Any:
    """
    Create new role with permission assignment.
    """
    try:
        role = await role_service.create_role(
            db,
            role_in,
            current_user_id=current_user.id,
            request=request
        )
        return role
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/roles/{role_id}", response_model=RoleSchema)
async def read_role_by_id(
    role_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Get a specific role by id with permission information.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )

    role = await role_service.get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return role

@router.put("/roles/{role_id}", response_model=RoleSchema)
async def update_role(
    *,
    db: AsyncSession = Depends(get_async_db),
    role_id: int = Path(..., gt=0),
    role_in: RoleUpdate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
    request: Request,
) -> Any:
    """
    Update a role with permission management.
    """
    role = await role_service.get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    try:
        updated_role = await role_service.update_role(
            db,
            role,
            role_in,
            current_user_id=current_user.id,
            request=request
        )
        return updated_role
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/roles/{role_id}", response_model=None)
async def delete_role(
    *,
    db: AsyncSession = Depends(get_async_db),
    role_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_superuser_with_cookie),
    request: Request,
) -> Any:
    """
    Delete a role.
    """
    role = await role_service.get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    try:
        await role_service.delete_role(
            db,
            role,
            current_user_id=current_user.id,
            request=request
        )
        return None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Permission Routes ---

@router.get("/permissions", response_model=List[PermissionSchema])
async def read_permissions(
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Retrieve permissions.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )

    permissions = await permission_service.get_permissions(db, skip, limit)
    return permissions

@router.post("/permissions", response_model=PermissionSchema)
async def create_permission(
    *,
    db: AsyncSession = Depends(get_async_db),
    permission_in: PermissionCreate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
    request: Request,
) -> Any:
    """
    Create new permission.
    """
    try:
        permission = await permission_service.create_permission(
            db,
            permission_in,
            current_user_id=current_user.id,
            request=request
        )
        return permission
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/permissions/{permission_id}", response_model=PermissionSchema)
async def read_permission_by_id(
    permission_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Get a specific permission by id.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )

    permission = await permission_service.get_permission_by_id(db, permission_id)
    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    return permission

@router.put("/permissions/{permission_id}", response_model=PermissionSchema)
async def update_permission(
    *,
    db: AsyncSession = Depends(get_async_db),
    permission_id: int = Path(..., gt=0),
    permission_in: PermissionUpdate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
    request: Request,
) -> Any:
    """
    Update a permission.
    """
    permission = await permission_service.get_permission_by_id(db, permission_id)
    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    try:
        updated_permission = await permission_service.update_permission(
            db,
            permission,
            permission_in,
            current_user_id=current_user.id,
            request=request
        )
        return updated_permission
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/permissions/{permission_id}", response_model=None)
async def delete_permission(
    *,
    db: AsyncSession = Depends(get_async_db),
    permission_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_superuser_with_cookie),
    request: Request,
) -> Any:
    """
    Delete a permission.
    """
    permission = await permission_service.get_permission_by_id(db, permission_id)
    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    try:
        await permission_service.delete_permission(
            db,
            permission,
            current_user_id=current_user.id,
            request=request
        )
        return None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))