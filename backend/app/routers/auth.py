from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token, 
    get_password_hash, 
    verify_password,
    get_current_user_with_cookie
)
from app.database import get_db
from app.models.users import User, Role
from app.schemas.auth import Token, Login, UserCreate, UserResponse, PasswordReset, PasswordChange
from app.auth.permissions import ROLE_PERMISSIONS

router = APIRouter(prefix="/auth", tags=["auth"])

def authenticate_user(db: Session, username_or_email: str, password: str) -> User:
    """Authenticates a user by username or email and password"""
    # Try to find user by username
    user = db.query(User).filter(User.username == username_or_email).first()
    
    # If not found by username, try email
    if not user:
        user = db.query(User).filter(User.email == username_or_email).first()
    
    # If user not found or password doesn't match, return None
    if not user or not user.verify_password(password):
        return None
        
    return user


@router.post("/token")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive",
        )
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=60 * 24)  # 24 hours
    )
    
    # Set cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=60 * 60 * 24,  # 24 hours
        expires=60 * 60 * 24,
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "role": {
                "id": user.role.id,
                "name": user.role.name,
                "description": user.role.description,
                "permissions": [
                    {"value": perm} 
                    for perm in ROLE_PERMISSIONS.get(user.role.name.lower(), [])
                ]
            } if user.role else None
        }
    }


@router.post("/login", response_model=Token)
def login_for_access_token(
    response: Response,
    db: Session = Depends(get_db), 
    login_data: Login = None
) -> Any:
    """
    Login for regular API clients
    """
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    
    # Set cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse)
def register_new_user(
    user_in: UserCreate, 
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new user
    """
    # Check if user with this email exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Check if username is taken
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The username is already taken.",
        )
    
    # Check if the role exists
    role = db.query(Role).filter(Role.id == user_in.role_id).first()
    if not role:
        raise HTTPException(
            status_code=400,
            detail="The specified role does not exist.",
        )
    
    # Create new user
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        is_active=True,
        is_superuser=False,
        role_id=user_in.role_id
    )
    db_user.set_password(user_in.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/password-reset", response_model=dict)
def reset_password(
    email_in: PasswordReset, 
    db: Session = Depends(get_db)
) -> Any:
    """
    Password recovery
    """
    user = db.query(User).filter(User.email == email_in.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    
    # In a real application, send a password reset email here
    # For this implementation, we'll just return a success message
    return {"message": "Password reset email sent"}


@router.post("/change-password", response_model=dict)
def change_password(
    password_data: PasswordChange,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Change user password
    """
    if not current_user.verify_password(password_data.current_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect current password"
        )
    
    current_user.set_password(password_data.new_password)
    db.add(current_user)
    db.commit()
    
    return {"message": "Password updated successfully"}


@router.get("/me", response_model=UserResponse)
def read_users_me(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get current user
    """
    return current_user


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing the cookie
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="lax",
    )
    return {"message": "Successfully logged out"}


@router.get("/verify")
async def verify_token(current_user: User = Depends(get_current_user_with_cookie)) -> Any:
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "role": {
            "id": current_user.role.id,
            "name": current_user.role.name,
            "description": current_user.role.description,
            "permissions": [
                {"value": perm} 
                for perm in ROLE_PERMISSIONS.get(current_user.role.name.lower(), [])
            ]
        } if current_user.role else None
    } 