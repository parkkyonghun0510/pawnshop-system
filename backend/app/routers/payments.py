from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User
from app.models.operations import Payment, Loan
from app.schemas.loans import Payment as PaymentSchema, PaymentCreate, PaymentUpdate
from app.core.security import get_current_user_with_cookie

# Example response for documentation
PAYMENT_EXAMPLE = {
    "id": 1,
    "loan_id": 1,
    "amount": 250.0,
    "payment_date": "2024-03-15T10:00:00",
    "payment_method": "cash",
    "reference_number": "PAY-12345",
    "notes": "Regular payment"
}

# Common error responses
COMMON_RESPONSES = {
    401: {"description": "Not authenticated"},
    403: {"description": "Not authorized"},
    404: {"description": "Resource not found"},
    422: {"description": "Validation error"},
    500: {"description": "Internal server error"}
}

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
    responses=COMMON_RESPONSES
)

@router.get("/", 
    response_model=List[PaymentSchema],
    summary="List payments",
    description="Retrieve a list of payments with optional filtering and pagination.",
    responses={
        200: {
            "description": "List of payments retrieved successfully",
            "content": {"application/json": {"example": [PAYMENT_EXAMPLE]}}
        }
    }
)
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    loan_id: Optional[int] = Query(None, description="Filter payments by loan ID"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return")
) -> Any:
    """List all payments with optional filtering."""
    query = db.query(Payment)
    if loan_id:
        query = query.filter(Payment.loan_id == loan_id)
    payments = query.offset(skip).limit(limit).all()
    return payments

@router.get("/{payment_id}", 
    response_model=PaymentSchema,
    summary="Get payment details",
    description="Retrieve detailed information about a specific payment.",
    responses={
        200: {
            "description": "Payment details retrieved successfully",
            "content": {"application/json": {"example": PAYMENT_EXAMPLE}}
        }
    }
)
def get_payment(
    payment_id: int = Path(..., gt=0, description="The ID of the payment to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """Get a specific payment by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.put("/{payment_id}", 
    response_model=PaymentSchema,
    summary="Update payment",
    description="Update an existing payment's details including amount, date, and method.",
    responses={
        200: {
            "description": "Payment updated successfully",
            "content": {"application/json": {"example": {
                **PAYMENT_EXAMPLE,
                "amount": 300.0,
                "payment_method": "credit_card",
                "reference_number": "PAY-12345-UPDATE",
                "notes": "Payment amount corrected"
            }}}
        }
    }
)
def update_payment(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    payment_id: int = Path(..., gt=0, description="The ID of the payment to update"),
    payment_in: PaymentUpdate
) -> Any:
    """Update a payment."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Update payment fields
    for field, value in payment_in.dict(exclude_unset=True).items():
        setattr(payment, field, value)
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.delete("/{payment_id}", 
    response_model=PaymentSchema,
    summary="Delete payment",
    description="Delete an existing payment record with validation checks.",
    responses={
        200: {
            "description": "Payment deleted successfully",
            "content": {"application/json": {"example": PAYMENT_EXAMPLE}}
        },
        400: {"description": "Cannot delete payment from a completed or defaulted loan"}
    }
)
def delete_payment(
    payment_id: int = Path(..., gt=0, description="The ID of the payment to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """Delete a payment with status validation."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check if payment can be deleted (e.g., not too old, loan status, etc.)
    loan = db.query(Loan).filter(Loan.id == payment.loan_id).first()
    if loan and loan.status in ["completed", "defaulted"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete payment from a completed or defaulted loan"
        )
    
    db.delete(payment)
    db.commit()
    return payment 