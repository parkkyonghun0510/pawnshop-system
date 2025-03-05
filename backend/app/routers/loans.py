from typing import Any, List, Optional, Dict, Union
from datetime import datetime, date, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body, status
from sqlalchemy import or_, and_, func, extract, desc, case
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.operations import Loan, Payment, Item, Customer, ItemStatus
from app.models.users import User
from app.schemas.loans import (
    Loan as LoanSchema,
    LoanCreate,
    LoanUpdate,
    LoanExtend,
    LoanRedeem,
    LoanDefault,
    LoanWithDetails,
    LoanSearchParams,
    LoanStats,
    LoanStatusEnum,
    Payment as PaymentSchema,
    PaymentCreate,
    PaymentUpdate
)
from app.core.security import get_current_user_with_cookie

router = APIRouter()


def generate_loan_code() -> str:
    """Generate a unique loan code"""
    # Format: L-xxxxxxxx (8 random alphanumeric characters)
    return f"L-{uuid.uuid4().hex[:8].upper()}"


def calculate_due_date(start_date: date, term_days: int) -> date:
    """Calculate the due date based on start date and term days"""
    return start_date + timedelta(days=term_days)


def calculate_loan_details(db: Session, loan: Loan) -> Dict[str, Any]:
    """Calculate loan details like total paid, remaining balance, etc."""
    # Calculate total paid
    total_paid = db.query(func.sum(Payment.amount)).filter(Payment.loan_id == loan.id).scalar() or 0
    
    # Calculate interest
    interest_amount = loan.loan_amount * (loan.interest_rate / 100)
    
    # Calculate remaining balance
    remaining_balance = loan.loan_amount + interest_amount - total_paid
    
    # Calculate days remaining and overdue
    today = date.today()
    days_remaining = (loan.due_date - today).days if loan.due_date > today else 0
    days_overdue = (today - loan.due_date).days if today > loan.due_date else 0
    is_overdue = days_overdue > 0
    
    return {
        "total_paid": total_paid,
        "remaining_balance": remaining_balance,
        "is_overdue": is_overdue,
        "days_remaining": days_remaining,
        "days_overdue": days_overdue
    }


@router.get("/", response_model=List[LoanSchema])
def read_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100,
    status: Optional[LoanStatusEnum] = None,
    customer_id: Optional[int] = None,
    item_id: Optional[int] = None,
    is_overdue: Optional[bool] = None
) -> Any:
    """
    Retrieve loans with optional filtering.
    """
    query = db.query(Loan)
    
    # Apply filters
    if status:
        query = query.filter(Loan.status == status)
    
    if customer_id:
        query = query.filter(Loan.customer_id == customer_id)
    
    if item_id:
        query = query.filter(Loan.item_id == item_id)
    
    if is_overdue is not None:
        today = date.today()
        if is_overdue:
            query = query.filter(
                and_(
                    Loan.due_date < today,
                    Loan.status.in_([LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value])
                )
            )
        else:
            query = query.filter(
                or_(
                    Loan.due_date >= today,
                    ~Loan.status.in_([LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value])
                )
            )
    
    # Apply pagination
    loans = query.order_by(Loan.created_at.desc()).offset(skip).limit(limit).all()
    
    # Enhance with calculated fields
    for loan in loans:
        loan_details = calculate_loan_details(db, loan)
        for key, value in loan_details.items():
            setattr(loan, key, value)
    
    return loans


@router.post("/", response_model=LoanSchema)
def create_loan(
    *,
    db: Session = Depends(get_db),
    loan_in: LoanCreate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create new loan.
    """
    # Check if customer exists
    customer = db.query(Customer).filter(Customer.id == loan_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    # Check if item exists
    item = db.query(Item).filter(Item.id == loan_in.item_id).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    
    # Check if item is available for pawning
    if item.status != ItemStatus.PAWNED.value and item.status != ItemStatus.FOR_SALE.value:
        raise HTTPException(
            status_code=400,
            detail=f"Item is not available for loan, current status: {item.status}"
        )
    
    # Generate loan code
    loan_code = generate_loan_code()
    
    # Create loan
    db_loan = Loan(
        loan_code=loan_code,
        customer_id=loan_in.customer_id,
        item_id=loan_in.item_id,
        loan_amount=loan_in.loan_amount,
        interest_rate=loan_in.interest_rate,
        term_days=loan_in.term_days,
        start_date=loan_in.start_date,
        due_date=loan_in.due_date,
        status=loan_in.status,
        collateral_description=loan_in.collateral_description,
        notes=loan_in.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    
    # Update item status to pawned
    item.status = ItemStatus.PAWNED.value
    db.add(item)
    
    # If initial payment provided, create payment record
    if loan_in.initial_payment:
        payment = Payment(
            loan_id=db_loan.id,
            amount=loan_in.initial_payment.amount,
            payment_date=loan_in.initial_payment.payment_date,
            payment_method=loan_in.initial_payment.payment_method,
            reference_number=loan_in.initial_payment.reference_number,
            notes=loan_in.initial_payment.notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(payment)
    
    db.commit()
    
    # Calculate loan details
    loan_details = calculate_loan_details(db, db_loan)
    for key, value in loan_details.items():
        setattr(db_loan, key, value)
    
    return db_loan


@router.get("/{loan_id}", response_model=LoanWithDetails)
def read_loan(
    *,
    db: Session = Depends(get_db),
    loan_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get loan by ID with customer and item details.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    
    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )
    
    # Get customer and item details
    customer = db.query(Customer).filter(Customer.id == loan.customer_id).first()
    item = db.query(Item).filter(Item.id == loan.item_id).first()
    
    if not customer or not item:
        raise HTTPException(
            status_code=404,
            detail="Related customer or item not found"
        )
    
    # Calculate loan details
    loan_details = calculate_loan_details(db, loan)
    for key, value in loan_details.items():
        setattr(loan, key, value)
    
    # Add customer and item details
    loan.customer_name = f"{customer.first_name} {customer.last_name}"
    loan.customer_phone = customer.phone
    loan.item_name = item.name
    loan.item_category = item.category
    
    # Get payments
    payments = db.query(Payment).filter(Payment.loan_id == loan.id).order_by(Payment.payment_date.desc()).all()
    loan.payments = payments
    
    return loan


@router.put("/{loan_id}", response_model=LoanSchema)
def update_loan(
    *,
    db: Session = Depends(get_db),
    loan_id: int = Path(..., gt=0),
    loan_in: LoanUpdate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update a loan.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    
    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )
    
    # Prevent updating completed or defaulted loans
    if loan.status in [LoanStatusEnum.COMPLETED.value, LoanStatusEnum.DEFAULTED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update loan with status: {loan.status}"
        )
    
    # Update loan data
    update_data = loan_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(loan, field, value)
    
    loan.updated_at = datetime.utcnow()
    
    db.add(loan)
    db.commit()
    db.refresh(loan)
    
    # Calculate loan details
    loan_details = calculate_loan_details(db, loan)
    for key, value in loan_details.items():
        setattr(loan, key, value)
    
    return loan


@router.post("/{loan_id}/payments", response_model=PaymentSchema)
def add_payment(
    *,
    db: Session = Depends(get_db),
    loan_id: int = Path(..., gt=0),
    payment_in: PaymentCreate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Add a payment to a loan.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    
    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )
    
    # Ensure loan is in a state that can accept payments
    if loan.status not in [LoanStatusEnum.PENDING.value, LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value, LoanStatusEnum.EXTENDED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add payment to loan with status: {loan.status}"
        )
    
    # Create payment
    payment = Payment(
        loan_id=loan_id,
        amount=payment_in.amount,
        payment_date=payment_in.payment_date,
        payment_method=payment_in.payment_method,
        reference_number=payment_in.reference_number,
        notes=payment_in.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(payment)
    
    # Calculate if loan is fully paid
    loan_details = calculate_loan_details(db, loan)
    total_paid_after_payment = loan_details["total_paid"] + payment_in.amount
    
    # If loan is fully paid, mark as completed
    if total_paid_after_payment >= loan.loan_amount + (loan.loan_amount * loan.interest_rate / 100):
        loan.status = LoanStatusEnum.COMPLETED.value
        loan.updated_at = datetime.utcnow()
        db.add(loan)
        
        # Update item status to redeemed
        item = db.query(Item).filter(Item.id == loan.item_id).first()
        if item:
            item.status = ItemStatus.REDEEMED.value
            db.add(item)
    
    db.commit()
    db.refresh(payment)
    
    return payment


@router.put("/{loan_id}/extend", response_model=LoanSchema)
def extend_loan(
    *,
    db: Session = Depends(get_db),
    loan_id: int = Path(..., gt=0),
    extension_in: LoanExtend,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Extend a loan's term.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    
    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )
    
    # Ensure loan is in a state that can be extended
    if loan.status not in [LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot extend loan with status: {loan.status}"
        )
    
    # Add extension payment if provided
    if extension_in.payment:
        payment = Payment(
            loan_id=loan_id,
            amount=extension_in.payment.amount,
            payment_date=extension_in.payment.payment_date,
            payment_method=extension_in.payment.payment_method,
            reference_number=extension_in.payment.reference_number,
            notes=extension_in.payment.notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(payment)
    
    # Extend the due date
    loan.due_date = loan.due_date + timedelta(days=extension_in.additional_days)
    loan.term_days = loan.term_days + extension_in.additional_days
    loan.status = LoanStatusEnum.EXTENDED.value
    
    if extension_in.notes:
        loan.notes = (loan.notes or "") + f"\nExtended on {date.today()}: {extension_in.notes}"
    
    loan.updated_at = datetime.utcnow()
    
    db.add(loan)
    db.commit()
    db.refresh(loan)
    
    # Calculate loan details
    loan_details = calculate_loan_details(db, loan)
    for key, value in loan_details.items():
        setattr(loan, key, value)
    
    return loan


@router.put("/{loan_id}/redeem", response_model=LoanSchema)
def redeem_loan(
    *,
    db: Session = Depends(get_db),
    loan_id: int = Path(..., gt=0),
    redemption_in: LoanRedeem,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Redeem a loan by paying the remaining balance.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    
    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )
    
    # Ensure loan is in a state that can be redeemed
    if loan.status not in [LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value, LoanStatusEnum.EXTENDED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot redeem loan with status: {loan.status}"
        )
    
    # Calculate remaining balance
    loan_details = calculate_loan_details(db, loan)
    remaining_balance = loan_details["remaining_balance"]
    
    # Verify redemption payment covers the remaining balance
    if redemption_in.payment.amount < remaining_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Redemption payment ({redemption_in.payment.amount}) is less than the remaining balance ({remaining_balance})"
        )
    
    # Add redemption payment
    payment = Payment(
        loan_id=loan_id,
        amount=redemption_in.payment.amount,
        payment_date=redemption_in.payment.payment_date,
        payment_method=redemption_in.payment.payment_method,
        reference_number=redemption_in.payment.reference_number,
        notes=redemption_in.payment.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(payment)
    
    # Update loan status
    loan.status = LoanStatusEnum.COMPLETED.value
    
    if redemption_in.notes:
        loan.notes = (loan.notes or "") + f"\nRedeemed on {date.today()}: {redemption_in.notes}"
    
    loan.updated_at = datetime.utcnow()
    
    db.add(loan)
    
    # Update item status to redeemed
    item = db.query(Item).filter(Item.id == loan.item_id).first()
    if item:
        item.status = ItemStatus.REDEEMED.value
        db.add(item)
    
    db.commit()
    db.refresh(loan)
    
    # Recalculate loan details
    loan_details = calculate_loan_details(db, loan)
    for key, value in loan_details.items():
        setattr(loan, key, value)
    
    return loan


@router.put("/{loan_id}/default", response_model=LoanSchema)
def default_loan(
    *,
    db: Session = Depends(get_db),
    loan_id: int = Path(..., gt=0),
    default_in: LoanDefault,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Mark a loan as defaulted.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    
    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )
    
    # Ensure loan is in a state that can be defaulted
    if loan.status not in [LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value, LoanStatusEnum.EXTENDED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot default loan with status: {loan.status}"
        )
    
    # Update loan status
    loan.status = LoanStatusEnum.DEFAULTED.value
    
    default_notes = f"Defaulted on {default_in.default_date}"
    if default_in.reason:
        default_notes += f", Reason: {default_in.reason}"
    if default_in.notes:
        default_notes += f", Notes: {default_in.notes}"
    
    loan.notes = (loan.notes or "") + f"\n{default_notes}"
    loan.updated_at = datetime.utcnow()
    
    db.add(loan)
    
    # Update item status to defaulted
    item = db.query(Item).filter(Item.id == loan.item_id).first()
    if item:
        item.status = ItemStatus.DEFAULTED.value
        db.add(item)
    
    db.commit()
    db.refresh(loan)
    
    # Calculate loan details
    loan_details = calculate_loan_details(db, loan)
    for key, value in loan_details.items():
        setattr(loan, key, value)
    
    return loan


@router.post("/search", response_model=List[LoanSchema])
def search_loans(
    *,
    db: Session = Depends(get_db),
    search_params: LoanSearchParams,
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Advanced search for loans.
    """
    query = db.query(Loan)
    
    # Apply search filters
    if search_params.search_term:
        search_term = f"%{search_params.search_term}%"
        query = query.filter(
            or_(
                Loan.loan_code.ilike(search_term),
                Loan.notes.ilike(search_term)
            )
        )
    
    if search_params.status:
        query = query.filter(Loan.status == search_params.status)
    
    if search_params.customer_id:
        query = query.filter(Loan.customer_id == search_params.customer_id)
    
    if search_params.item_id:
        query = query.filter(Loan.item_id == search_params.item_id)
    
    if search_params.min_amount is not None:
        query = query.filter(Loan.loan_amount >= search_params.min_amount)
    
    if search_params.max_amount is not None:
        query = query.filter(Loan.loan_amount <= search_params.max_amount)
    
    if search_params.start_date_from:
        query = query.filter(Loan.start_date >= search_params.start_date_from)
    
    if search_params.start_date_to:
        query = query.filter(Loan.start_date <= search_params.start_date_to)
    
    if search_params.due_date_from:
        query = query.filter(Loan.due_date >= search_params.due_date_from)
    
    if search_params.due_date_to:
        query = query.filter(Loan.due_date <= search_params.due_date_to)
    
    if search_params.is_overdue is not None:
        today = date.today()
        if search_params.is_overdue:
            query = query.filter(
                and_(
                    Loan.due_date < today,
                    Loan.status.in_([LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value])
                )
            )
        else:
            query = query.filter(
                or_(
                    Loan.due_date >= today,
                    ~Loan.status.in_([LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value])
                )
            )
    
    # Apply pagination
    loans = query.order_by(Loan.created_at.desc()).offset(skip).limit(limit).all()
    
    # Calculate loan details for each loan
    for loan in loans:
        loan_details = calculate_loan_details(db, loan)
        for key, value in loan_details.items():
            setattr(loan, key, value)
    
    return loans


@router.get("/stats/overview", response_model=LoanStats)
def get_loan_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Any:
    """
    Get loan statistics.
    """
    query = db.query(Loan)
    
    # Apply date filters if provided
    if start_date:
        query = query.filter(Loan.created_at >= start_date)
    
    if end_date:
        query = query.filter(Loan.created_at <= end_date)
    
    # Total loans
    total_loans = query.count()
    
    # Loans by status
    loans_by_status = {}
    for status in LoanStatusEnum:
        count = query.filter(Loan.status == status.value).count()
        loans_by_status[status.value] = count
    
    # Active, completed, defaulted, overdue loans
    active_loans = loans_by_status.get(LoanStatusEnum.ACTIVE.value, 0)
    completed_loans = loans_by_status.get(LoanStatusEnum.COMPLETED.value, 0)
    defaulted_loans = loans_by_status.get(LoanStatusEnum.DEFAULTED.value, 0)
    
    # Calculate overdue loans (active loans past due date)
    today = date.today()
    overdue_loans = query.filter(
        and_(
            Loan.due_date < today,
            Loan.status.in_([LoanStatusEnum.ACTIVE.value, LoanStatusEnum.OVERDUE.value])
        )
    ).count()
    
    # Financial metrics
    total_loan_amount = db.query(func.sum(Loan.loan_amount)).scalar() or 0
    
    # Calculate interest earned from payments
    # This is an approximation - in a real system, you'd need to track interest vs principal
    total_payments = db.query(func.sum(Payment.amount)).join(
        Loan, Payment.loan_id == Loan.id
    ).scalar() or 0
    
    # Rough estimate of interest earned
    total_interest_earned = total_payments - total_loan_amount if total_payments > total_loan_amount else 0
    
    # Average loan metrics
    avg_loan_amount = total_loan_amount / total_loans if total_loans > 0 else 0
    avg_loan_term = db.query(func.avg(Loan.term_days)).scalar() or 0
    
    # Loans by month
    loans_by_month = []
    
    # Get current date and go back 12 months
    current_date = datetime.now()
    for i in range(12):
        month_date = current_date - timedelta(days=30 * i)
        month_year = month_date.strftime("%Y-%m")
        
        month_loans = db.query(func.count(Loan.id)).filter(
            and_(
                extract('year', Loan.created_at) == month_date.year,
                extract('month', Loan.created_at) == month_date.month
            )
        ).scalar()
        
        month_amount = db.query(func.sum(Loan.loan_amount)).filter(
            and_(
                extract('year', Loan.created_at) == month_date.year,
                extract('month', Loan.created_at) == month_date.month
            )
        ).scalar() or 0
        
        loans_by_month.append({
            "month": month_year,
            "count": month_loans,
            "amount": month_amount
        })
    
    return {
        "total_loans": total_loans,
        "active_loans": active_loans,
        "completed_loans": completed_loans,
        "defaulted_loans": defaulted_loans,
        "overdue_loans": overdue_loans,
        "total_loan_amount": total_loan_amount,
        "total_interest_earned": total_interest_earned,
        "avg_loan_amount": avg_loan_amount,
        "avg_loan_term": avg_loan_term,
        "loans_by_status": loans_by_status,
        "loans_by_month": loans_by_month
    } 