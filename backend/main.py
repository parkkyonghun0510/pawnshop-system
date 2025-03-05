from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Pawn Shop Management System API",
    description="API for managing pawn shop operations, employees, customers, and financial transactions",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Pawn Shop Management System API",
        "documentation": "/docs",
        "status": "online"
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

# Import and include routers
from app.routers import (
    auth, users, branches, employees, customers, inventory, 
    loans, transactions, reports, applications, collaterals, payments
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(branches.router, prefix="/branches", tags=["Branches"])
app.include_router(employees.router, prefix="/employees", tags=["Employees"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(loans.router, prefix="/loans", tags=["Loans"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(applications.router, prefix="/applications", tags=["Applications"])
app.include_router(collaterals.router, prefix="/collaterals", tags=["Collaterals"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Run the application with uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 