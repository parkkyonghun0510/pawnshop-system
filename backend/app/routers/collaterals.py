from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User
from app.models.operations import Item, Loan
from app.schemas.loans import Loan as LoanSchema
from app.core.security import get_current_user_with_cookie

# Example response for documentation
LOAN_EXAMPLE = {
    "id": 1,
    "loan_code": "L-12345678",
    "customer_id": 1,
    "item_id": 1,
    "loan_amount": 1000.0,
    "interest_rate": 5.0,
    "term_days": 30,
    "collateral_description": "Gold necklace, 18k, 25g",
    "status": "active",
    "total_paid": 250.0,
    "remaining_balance": 800.0
}

router = APIRouter(
    prefix="/collaterals",
    tags=["Collaterals"],
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
        404: {"description": "Resource not found"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"}
    }
)

@router.get("/{loan_id}/collateral", 
    response_model=LoanSchema,
    summary="Get loan collateral details",
    description="Retrieve detailed information about a loan's collateral including valuation and status.",
    responses={
        200: {
            "description": "Collateral details retrieved successfully",
            "content": {"application/json": {"example": LOAN_EXAMPLE}}
        }
    }
)
def get_loan_collateral(
    loan_id: int = Path(..., gt=0, description="The ID of the loan to get collateral details for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """Get collateral details for a loan."""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

@router.get("/items/{item_id}", 
    response_model=LoanSchema,
    summary="Get item's loan details",
    description="Retrieve loan details for a specific collateral item including payment history and status.",
    responses={
        200: {
            "description": "Loan details retrieved successfully",
            "content": {"application/json": {"example": LOAN_EXAMPLE}}
        }
    }
)
def get_item_collateral(
    item_id: int = Path(..., gt=0, description="The ID of the item to get loan details for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """Get loan details for a collateral item."""
    loan = db.query(Loan).filter(Loan.item_id == item_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="No loan found for this item")
    return loan 