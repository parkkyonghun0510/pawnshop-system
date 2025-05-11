from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.database import get_async_db, get_db


# Setup password hashing context
# Include both bcrypt and bcrypt_sha256, but mark bcrypt as deprecated
# This allows verifying existing bcrypt hashes while creating new ones with bcrypt_sha256
pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="bcrypt",  # Mark bcrypt as deprecated so new hashes use bcrypt_sha256
    bcrypt__default_rounds=12
)

# Token-related constants
ALGORITHM = "HS256"

# OAuth2 scheme for token extraction from header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password
    """
    return pwd_context.hash(password)


async def get_token_from_cookie_or_header(request: Request):
    """
    Extract token from either cookie or Authorization header
    """
    # Print all headers for debugging
    print("Request headers:", request.headers)

    # Print all cookies for debugging
    print("Request cookies:", request.cookies)

    # First try to get from authorization header
    try:
        auth_header = request.headers.get("Authorization")
        print("Authorization header:", auth_header)

        if auth_header:
            # Extract token from Authorization header
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication scheme",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            print("Token from header:", token)
            return token
        else:
            # If no authorization header, try to get from cookie
            token = request.cookies.get("access_token")
            print("Token from cookie:", token)

            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Remove 'Bearer ' prefix if it exists
            if token.startswith("Bearer "):
                token = token[7:]
                print("Token after removing Bearer prefix:", token)

            return token
    except Exception as e:
        print(f"Error extracting token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication error",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_with_cookie(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Validate token and get current user (supports both header and cookie auth)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = await get_token_from_cookie_or_header(request)

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception

    except jwt.JWTError:
        raise credentials_exception

    from app.models.users import User  # Import here to avoid circular imports

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


def get_current_active_superuser_with_cookie(
    current_user = Depends(get_current_user_with_cookie),
):
    """
    Check if current user is a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges"
        )
    return current_user