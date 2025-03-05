from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
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
def read_users(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    current_user = Depends(get_current_user_with_cookie)
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
    query = db.query(User)
    
    if first_name:
        query = query.filter(User.first_name.ilike(f"%{first_name}%"))
    if last_name:
        query = query.filter(User.last_name.ilike(f"%{last_name}%"))
    if email:
        query = query.filter(User.email.ilike(f"%{email}%"))
    if username:
        query = query.filter(User.username.ilike(f"%{username}%"))
    
    users = query.offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create new user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser,
        role_id=user_in.role_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/{user_id}", response_model=UserResponse)
def read_user_by_id(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
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
def update_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
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
    if user_in.first_name is not None:
        user.first_name = user_in.first_name
    if user_in.last_name is not None:
        user.last_name = user_in.last_name
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
        user.hashed_password = get_password_hash(user_in.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserResponse)
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
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
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Retrieve roles.
    """
    roles = db.query(Role).offset(skip).limit(limit).all()
    return roles


@router.post("/roles/", response_model=RoleSchema)
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: RoleCreate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Create new role.
    """
    role = db.query(Role).filter(Role.name == role_in.name).first()
    if role:
        raise HTTPException(
            status_code=400,
            detail="The role with this name already exists.",
        )
    
    role = Role(**role_in.dict())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/roles/{role_id}", response_model=RoleSchema)
def read_role_by_id(
    role_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
) -> Any:
    """
    Get a specific role by id.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )
    return role


@router.put("/roles/{role_id}", response_model=RoleSchema)
def update_role(
    *,
    db: Session = Depends(get_db),
    role_id: int = Path(..., gt=0),
    role_in: RoleUpdate,
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Update a role.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
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
    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}", response_model=RoleSchema)
def delete_role(
    *,
    db: Session = Depends(get_db),
    role_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_superuser_with_cookie),
) -> Any:
    """
    Delete a role.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )
    
    # Check if any users are using this role
    users_with_role = db.query(User).filter(User.role_id == role_id).count()
    if users_with_role > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role that is assigned to {users_with_role} users",
        )
    
    db.delete(role)
    db.commit()
    return role


# --- Permission Routes ---

@router.get("/permissions/", response_model=List[PermissionSchema])
def read_permissions(
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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