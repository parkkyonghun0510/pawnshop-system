from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Schema for token payload"""
    sub: Optional[str] = None


class Login(BaseModel):
    """Schema for login credentials"""
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    """Schema for user creation"""
    email: EmailStr
    username: str
    password: str
    first_name: str
    last_name: str
    role_id: int


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    is_superuser: bool
    role_id: int
    role: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class PasswordReset(BaseModel):
    """Schema for password reset request"""
    email: EmailStr


class PasswordChange(BaseModel):
    """Schema for password change"""
    current_password: str
    new_password: str 