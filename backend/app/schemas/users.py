from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = True


class UserCreate(BaseModel):
    """Schema for creating a user"""
    email: EmailStr
    username: str
    password: str
    first_name: str
    last_name: str
    role_id: int
    is_active: bool = True
    is_superuser: bool = False


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserFilter(BaseModel):
    """Schema for filtering users"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserInDBBase(UserBase):
    """Base schema for users in DB"""
    id: int
    username: str
    role_id: int
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    """Schema for returning user data"""
    pass


class UserResponse(UserInDBBase):
    """Schema for returning user data in API responses"""
    role: Optional[dict] = None


class UserInDB(UserInDBBase):
    """Schema for user with hashed password in DB"""
    hashed_password: str


class RoleBase(BaseModel):
    """Base role schema"""
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Schema for creating a role"""
    pass


class RoleUpdate(BaseModel):
    """Schema for updating a role"""
    name: Optional[str] = None
    description: Optional[str] = None


class Role(RoleBase):
    """Schema for returning role data"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PermissionBase(BaseModel):
    """Base permission schema"""
    name: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    """Schema for creating a permission"""
    pass


class PermissionUpdate(BaseModel):
    """Schema for updating a permission"""
    name: Optional[str] = None
    description: Optional[str] = None


class Permission(PermissionBase):
    """Schema for returning permission data"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True) 