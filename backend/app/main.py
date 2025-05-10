import time
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi import FastAPI, Request, status, Depends, Response, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base, engine, get_async_db
from app.routers import users, branches, employees, customers, transactions, loans, auth, collaterals, payments, applications, reports, audit
from app.models.users import User, Role
from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_current_user_with_cookie
from app.websockets.dashboard import dashboard_manager

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
    expose_headers=["Content-Type", "Authorization", "Set-Cookie", "Access-Control-Allow-Origin"],
    max_age=600  # Cache preflight requests for 10 minutes
)

# Include routers with API version prefix
api_prefix = settings.API_V1_STR

app.include_router(auth.router, prefix=f"{api_prefix}/authentication", tags=["Authentication"])
app.include_router(users.router, prefix=f"{api_prefix}/users", tags=["users"])
app.include_router(branches.router, prefix=f"{api_prefix}/branches", tags=["branches"])
app.include_router(employees.router, prefix=f"{api_prefix}/employees", tags=["employees"])
app.include_router(customers.router, prefix=f"{api_prefix}/customers", tags=["customers"])
app.include_router(transactions.router, prefix=f"{api_prefix}/transactions", tags=["transactions"])
app.include_router(loans.router, prefix=f"{api_prefix}/loans", tags=["loans"])
app.include_router(collaterals.router, prefix=f"{api_prefix}/collaterals", tags=["collaterals"])
app.include_router(payments.router, prefix=f"{api_prefix}/payments", tags=["payments"])
app.include_router(applications.router, prefix=f"{api_prefix}/applications", tags=["applications"])
app.include_router(reports.router, prefix=f"{api_prefix}/dashboard", tags=["reports"])
app.include_router(audit.router, prefix=f"{api_prefix}/audit", tags=["audit"])

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Middleware to add X-Process-Time header to responses"""
    # Debug cookies and headers
    print(f"Request path: {request.url.path}")
    print(f"Request cookies: {request.cookies}")
    print(f"Request headers: {request.headers}")

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    # Debug response headers
    print(f"Response headers: {response.headers}")

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


@app.post(f"{api_prefix}/token", response_model=Dict[str, Any])
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db)
):
    """Endpoint for OAuth2 compatible login"""
    # Try to authenticate with username or email
    user = None

    # First try username
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        # Try email
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user or not verify_password(form_data.password, user.password_hash):
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
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",  # Important: set the path to root
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
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "role_id": user.role_id
        }
    }


@app.get(f"{api_prefix}/users/me")
async def read_users_me(
    request: Request,
    current_user = Depends(get_current_user_with_cookie)
):
    """Endpoint to get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "role_id": current_user.role_id,
        "role": {
            "id": current_user.role.id,
            "name": current_user.role.name,
            "description": current_user.role.description
        } if current_user.role else None
    }


@app.post(f"{api_prefix}/auth/logout")
async def logout(response: Response):
    """Endpoint to logout user"""
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="lax",
    )
    return {"message": "Successfully logged out"}


@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time dashboard updates"""
    print("DEBUG: WebSocket endpoint hit, attempting to connect...")
    try:
        await dashboard_manager.connect(websocket)
        print(f"DEBUG: dashboard_manager.connect completed for client: {websocket.client}")
        try:
            while True:
                # Keep the connection alive by waiting for messages (or ping/pong)
                data = await websocket.receive_text()
                print(f"DEBUG: Received text from WebSocket: {data} from {websocket.client}") # Optional: log received data
        except WebSocketDisconnect:
            print(f"DEBUG: WebSocket disconnected: {websocket.client}")
            dashboard_manager.disconnect(websocket)
        except Exception as e_ws_loop:
            print(f"DEBUG: Error in WebSocket receive loop for {websocket.client}: {e_ws_loop}")
            # Consider disconnecting if an unexpected error occurs in the loop
            # await dashboard_manager.disconnect(websocket)
            # Depending on the error, you might want to close the websocket explicitly here
            # if websocket.client_state == WebSocketState.CONNECTED:
            #     await websocket.close(code=1011)
    except Exception as e_connect:
        print(f"DEBUG: Error during dashboard_manager.connect or initial setup for {websocket.client}: {e_connect}")
        # Ensure the websocket is closed if connect failed.
        # FastAPI might handle this, but being explicit can be safer.
        # if websocket.client_state != WebSocketState.DISCONNECTED:
        #     try:
        #         await websocket.close(code=1011) # 1011 indicates an internal server error
        #     except RuntimeError: # If already closed or in an invalid state
        #         pass
        # It's often good to re-raise e_connect if Uvicorn should see it,
        # but for debugging, just printing might be enough initially.