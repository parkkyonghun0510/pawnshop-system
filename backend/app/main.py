import time
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi import FastAPI, Request, status, Depends, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.routers import users, branches, employees, customers, transactions, loans, auth, collaterals, payments, applications
from app.models.users import User, Role
from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_current_user_with_cookie

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pawnshop Management System API",
    description="API for managing pawnshop operations",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(branches.router, prefix="/branches", tags=["branches"])
app.include_router(employees.router, prefix="/employees", tags=["employees"])
app.include_router(customers.router, prefix="/customers", tags=["customers"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
app.include_router(loans.router, prefix="/loans", tags=["loans"])
app.include_router(collaterals.router, prefix="/collaterals", tags=["collaterals"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(applications.router, prefix="/applications", tags=["applications"])

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Middleware to add X-Process-Time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.get("/")
async def root():
    """Root endpoint for API health check"""
    return {
        "message": "Pawnshop Management System API",
        "status": "running",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.post("/token", response_model=Dict[str, Any])
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Endpoint for OAuth2 compatible login"""
    # Try to authenticate with username or email
    user = None
    
    # First try username
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Try email
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
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
            "role_id": user.role_id
        }
    }


@app.get("/users/me")
async def read_users_me(
    request: Request,
    current_user = Depends(get_current_user_with_cookie)
):
    """Endpoint to get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "role_id": current_user.role_id,
        "role": {
            "id": current_user.role.id,
            "name": current_user.role.name,
            "description": current_user.role.description
        } if current_user.role else None
    }


@app.post("/auth/logout")
async def logout(response: Response):
    """Endpoint to logout user"""
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="lax",
    )
    return {"message": "Successfully logged out"} 