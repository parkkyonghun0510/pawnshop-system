from typing import Any, List, Optional, Dict, Union
from datetime import datetime, date, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body, status
from sqlalchemy import or_, and_, func, extract, desc
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.operations import Transaction, TransactionType, Customer, Item, Loan
from app.models.users import User
from app.models.organization import Employee
from app.schemas.transactions import (
    Transaction as TransactionSchema,
    TransactionCreate,
    TransactionUpdate,
    TransactionWithDetails,
    TransactionSearchParams,
    TransactionStats,
    TransactionTypeEnum,
    TransactionStatusEnum,
    PaymentMethodEnum
)
from app.core.security import get_current_user_with_cookie

router = APIRouter()


def generate_transaction_code() -> str:
    """Generate a unique transaction code"""
    # Format: T-xxxxxxxx (8 random alphanumeric characters)
    return f"T-{uuid.uuid4().hex[:8].upper()}"


@router.get("/", response_model=List[TransactionSchema])
def read_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100,
    transaction_type: Optional[TransactionTypeEnum] = None,
    status: Optional[TransactionStatusEnum] = None,
    customer_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Any:
    """
    Retrieve transactions with optional filtering.
    """
    query = db.query(Transaction)
    
    # Apply filters
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    if status:
        query = query.filter(Transaction.status == status)
    
    if customer_id:
        query = query.filter(Transaction.customer_id == customer_id)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    # Apply pagination
    transactions = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
    
    return transactions


@router.post("/", response_model=TransactionSchema)
def create_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create new transaction.
    """
    # Check if related entities exist
    if transaction_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == transaction_in.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )
    
    if transaction_in.employee_id:
        employee = db.query(Employee).filter(Employee.id == transaction_in.employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found"
            )
    
    if transaction_in.loan_id:
        loan = db.query(Loan).filter(Loan.id == transaction_in.loan_id).first()
        if not loan:
            raise HTTPException(
                status_code=404,
                detail="Loan not found"
            )
    
    if transaction_in.item_id:
        item = db.query(Item).filter(Item.id == transaction_in.item_id).first()
        if not item:
            raise HTTPException(
                status_code=404,
                detail="Item not found"
            )
    
    # Generate transaction code
    transaction_code = generate_transaction_code()
    
    # Create transaction
    db_transaction = Transaction(
        transaction_code=transaction_code,
        transaction_type=transaction_in.transaction_type,
        amount=transaction_in.amount,
        payment_method=transaction_in.payment_method,
        status=transaction_in.status,
        reference_number=transaction_in.reference_number,
        transaction_date=transaction_in.transaction_date,
        customer_id=transaction_in.customer_id,
        employee_id=transaction_in.employee_id,
        loan_id=transaction_in.loan_id,
        item_id=transaction_in.item_id,
        notes=transaction_in.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction


@router.get("/{transaction_id}", response_model=TransactionWithDetails)
def read_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get transaction by ID with related details.
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )
    
    # Get related details
    transaction_with_details = TransactionWithDetails.from_orm(transaction)
    
    # Add customer name if customer_id is present
    if transaction.customer_id:
        customer = db.query(Customer).filter(Customer.id == transaction.customer_id).first()
        if customer:
            transaction_with_details.customer_name = f"{customer.first_name} {customer.last_name}"
    
    # Add employee name if employee_id is present
    if transaction.employee_id:
        employee = db.query(Employee).filter(Employee.id == transaction.employee_id).first()
        if employee:
            transaction_with_details.employee_name = f"{employee.first_name} {employee.last_name}"
    
    # Add loan code if loan_id is present
    if transaction.loan_id:
        loan = db.query(Loan).filter(Loan.id == transaction.loan_id).first()
        if loan:
            transaction_with_details.loan_code = loan.loan_code
    
    # Add item name if item_id is present
    if transaction.item_id:
        item = db.query(Item).filter(Item.id == transaction.item_id).first()
        if item:
            transaction_with_details.item_name = item.name
    
    return transaction_with_details


@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int = Path(..., gt=0),
    transaction_in: TransactionUpdate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update a transaction.
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )
    
    # Prevent updating completed or cancelled transactions
    if transaction.status in [TransactionStatusEnum.COMPLETED.value, TransactionStatusEnum.CANCELLED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update transaction with status: {transaction.status}"
        )
    
    # Update transaction data
    update_data = transaction_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    transaction.updated_at = datetime.utcnow()
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.put("/{transaction_id}/cancel", response_model=TransactionSchema)
def cancel_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int = Path(..., gt=0),
    notes: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Cancel a transaction.
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )
    
    # Prevent cancelling already completed or cancelled transactions
    if transaction.status in [TransactionStatusEnum.COMPLETED.value, TransactionStatusEnum.CANCELLED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel transaction with status: {transaction.status}"
        )
    
    # Update transaction status
    transaction.status = TransactionStatusEnum.CANCELLED.value
    
    if notes:
        transaction.notes = (transaction.notes or "") + f"\nCancelled on {datetime.utcnow()}: {notes}"
    
    transaction.updated_at = datetime.utcnow()
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.put("/{transaction_id}/complete", response_model=TransactionSchema)
def complete_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int = Path(..., gt=0),
    notes: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Mark a transaction as completed.
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )
    
    # Prevent completing already completed or cancelled transactions
    if transaction.status in [TransactionStatusEnum.COMPLETED.value, TransactionStatusEnum.CANCELLED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete transaction with status: {transaction.status}"
        )
    
    # Update transaction status
    transaction.status = TransactionStatusEnum.COMPLETED.value
    
    if notes:
        transaction.notes = (transaction.notes or "") + f"\nCompleted on {datetime.utcnow()}: {notes}"
    
    transaction.updated_at = datetime.utcnow()
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.post("/search", response_model=List[TransactionSchema])
def search_transactions(
    *,
    db: Session = Depends(get_db),
    search_params: TransactionSearchParams,
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Advanced search for transactions.
    """
    query = db.query(Transaction)
    
    # Apply search filters
    if search_params.search_term:
        search_term = f"%{search_params.search_term}%"
        query = query.filter(
            or_(
                Transaction.transaction_code.ilike(search_term),
                Transaction.reference_number.ilike(search_term)
            )
        )
    
    if search_params.transaction_type:
        query = query.filter(Transaction.transaction_type == search_params.transaction_type)
    
    if search_params.status:
        query = query.filter(Transaction.status == search_params.status)
    
    if search_params.payment_method:
        query = query.filter(Transaction.payment_method == search_params.payment_method)
    
    if search_params.min_amount is not None:
        query = query.filter(Transaction.amount >= search_params.min_amount)
    
    if search_params.max_amount is not None:
        query = query.filter(Transaction.amount <= search_params.max_amount)
    
    if search_params.customer_id:
        query = query.filter(Transaction.customer_id == search_params.customer_id)
    
    if search_params.employee_id:
        query = query.filter(Transaction.employee_id == search_params.employee_id)
    
    if search_params.loan_id:
        query = query.filter(Transaction.loan_id == search_params.loan_id)
    
    if search_params.item_id:
        query = query.filter(Transaction.item_id == search_params.item_id)
    
    if search_params.start_date:
        query = query.filter(Transaction.transaction_date >= search_params.start_date)
    
    if search_params.end_date:
        query = query.filter(Transaction.transaction_date <= search_params.end_date)
    
    # Apply pagination
    transactions = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
    
    return transactions


@router.get("/stats/overview", response_model=TransactionStats)
def get_transaction_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Any:
    """
    Get transaction statistics.
    """
    query = db.query(Transaction)
    
    # Apply date filters if provided
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    # Total transactions and amount
    total_transactions = query.count()
    total_amount = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == TransactionStatusEnum.COMPLETED.value
    ).scalar() or 0
    
    # Transactions by type
    transactions_by_type = {}
    for transaction_type in TransactionTypeEnum:
        count = query.filter(Transaction.transaction_type == transaction_type.value).count()
        transactions_by_type[transaction_type.value] = count
    
    # Transactions by status
    transactions_by_status = {}
    for status in TransactionStatusEnum:
        count = query.filter(Transaction.status == status.value).count()
        transactions_by_status[status.value] = count
    
    # Transactions by payment method
    transactions_by_payment_method = {}
    for payment_method in PaymentMethodEnum:
        count = query.filter(Transaction.payment_method == payment_method.value).count()
        transactions_by_payment_method[payment_method.value] = count
    
    # Daily transactions (last 30 days)
    daily_transactions = []
    today = date.today()
    for i in range(30):
        day_date = today - timedelta(days=i)
        
        # Count transactions on this day
        day_count = db.query(func.count(Transaction.id)).filter(
            and_(
                func.date(Transaction.transaction_date) == day_date,
                Transaction.status == TransactionStatusEnum.COMPLETED.value
            )
        ).scalar()
        
        # Sum transaction amounts on this day
        day_amount = db.query(func.sum(Transaction.amount)).filter(
            and_(
                func.date(Transaction.transaction_date) == day_date,
                Transaction.status == TransactionStatusEnum.COMPLETED.value
            )
        ).scalar() or 0
        
        daily_transactions.append({
            "date": day_date.isoformat(),
            "count": day_count,
            "amount": day_amount
        })
    
    # Monthly transactions (last 12 months)
    monthly_transactions = []
    current_date = datetime.now()
    for i in range(12):
        month_date = current_date - timedelta(days=30 * i)
        
        # Count transactions in this month
        month_count = db.query(func.count(Transaction.id)).filter(
            and_(
                extract('year', Transaction.transaction_date) == month_date.year,
                extract('month', Transaction.transaction_date) == month_date.month,
                Transaction.status == TransactionStatusEnum.COMPLETED.value
            )
        ).scalar()
        
        # Sum transaction amounts in this month
        month_amount = db.query(func.sum(Transaction.amount)).filter(
            and_(
                extract('year', Transaction.transaction_date) == month_date.year,
                extract('month', Transaction.transaction_date) == month_date.month,
                Transaction.status == TransactionStatusEnum.COMPLETED.value
            )
        ).scalar() or 0
        
        monthly_transactions.append({
            "month": month_date.strftime("%Y-%m"),
            "count": month_count,
            "amount": month_amount
        })
    
    return {
        "total_transactions": total_transactions,
        "total_amount": total_amount,
        "transactions_by_type": transactions_by_type,
        "transactions_by_status": transactions_by_status,
        "transactions_by_payment_method": transactions_by_payment_method,
        "daily_transactions": daily_transactions,
        "monthly_transactions": monthly_transactions
    } 