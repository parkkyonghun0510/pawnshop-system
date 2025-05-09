from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

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
    UserFilter
)
from app.core.security import (
    get_current_user_with_cookie,
    get_current_active_superuser_with_cookie,
    get_password_hash
)

router = APIRouter()

# --- User Routes ---

@router.get("/", response_model=List[UserResponse])
async def read_users(
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100,
    email: Optional[str] = None,
    username: Optional[str] = None
) -> Any:
    """
    Retrieve users.
    """
    # Check permissions - if not superuser, can only view own user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )
    # Build query with filters
    query = select(User)
    if email:
        query = query.where(User.email.ilike(f"%{email}%"))
    if username:
        query = query.where(User.username.ilike(f"%{username}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    return users


@router.post("/", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create new user.
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    # Create new user
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser,
        role_id=user_in.role_id
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

    db_user.set_password(user_in.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/{user_id}", response_model=UserResponse)
async def read_user_by_id(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get a specific user by id.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Check permissions - if not superuser, can only view own user
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Check permissions - if not superuser, can only update own user
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this resource"
        )
    
    # Update user fields
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.username is not None:
        user.username = user_in.username
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    
    # Only superusers can change these fields
    if current_user.is_superuser:
        if user_in.is_superuser is not None:
            user.is_superuser = user_in.is_superuser
        if user_in.role_id is not None:
            user.role_id = user_in.role_id
    
    # Update password if provided
    if user_in.password:
        user.set_password(user_in.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Delete a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Don't allow deleting yourself
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own user account"
        )
    
    db.delete(user)
    db.commit()
    return user


# --- Role Routes ---

@router.get("/roles/", response_model=List[RoleSchema])
async def read_roles(
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Retrieve roles.
    """
    result = await db.execute(select(Role).offset(skip).limit(limit))
    roles = result.scalars().all()
    return roles


@router.post("/roles/", response_model=RoleSchema)
async def create_role(
    *,
    db: AsyncSession = Depends(get_async_db),
    role_in: RoleCreate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Create new role.
    """
    result = await db.execute(select(Role).where(Role.name == role_in.name))
    role = result.scalar_one_or_none()
    if role:
        raise HTTPException(
            status_code=400,
            detail="The role with this name already exists.",
        )
    role = Role(**role_in.dict())
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@router.get("/roles/{role_id}", response_model=RoleSchema)
async def read_role_by_id(
    role_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Get a specific role by id.
    """
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )
    return role


@router.put("/roles/{role_id}", response_model=RoleSchema)
async def update_role(
    *,
    db: AsyncSession = Depends(get_async_db),
    role_id: int = Path(..., gt=0),
    role_in: RoleUpdate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Update a role.
    """
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )
    # Update role data
    update_data = role_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@router.delete("/roles/{role_id}", response_model=RoleSchema)
async def delete_role(
    *,
    db: AsyncSession = Depends(get_async_db),
    role_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Delete a role.
    """
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )
    
    # Check if any users are using this role
    result = await db.execute(select(User).where(User.role_id == role_id))
    users_with_role = result.scalars().all()
    if len(users_with_role) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role that is assigned to {len(users_with_role)} users",
        )
    
    db.delete(role)
    db.commit()
    return role


# --- Permission Routes ---

@router.get("/permissions/", response_model=List[PermissionSchema])
def read_permissions(
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Retrieve permissions.
    """
    permissions = db.query(Permission).offset(skip).limit(limit).all()
    return permissions


@router.post("/permissions/", response_model=PermissionSchema)
def create_permission(
    *,
    db: AsyncSession = Depends(get_async_db),
    permission_in: PermissionCreate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Create new permission.
    """
    permission = db.query(Permission).filter(Permission.name == permission_in.name).first()
    if permission:
        raise HTTPException(
            status_code=400,
            detail="The permission with this name already exists.",
        )
    
    permission = Permission(**permission_in.dict())
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


@router.get("/permissions/{permission_id}", response_model=PermissionSchema)
def read_permission_by_id(
    permission_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Get a specific permission by id.
    """
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found",
        )
    return permission


@router.put("/permissions/{permission_id}", response_model=PermissionSchema)
def update_permission(
    *,
    db: AsyncSession = Depends(get_async_db),
    permission_id: int = Path(..., gt=0),
    permission_in: PermissionUpdate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Update a permission.
    """
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found",
        )
    
    # Update permission data
    update_data = permission_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(permission, field, value)
    
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


@router.delete("/permissions/{permission_id}", response_model=PermissionSchema)
def delete_permission(
    *,
    db: AsyncSession = Depends(get_async_db),
    permission_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Delete a permission.
    """
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found",
        )
    
    db.delete(permission)
    db.commit()
    return permission