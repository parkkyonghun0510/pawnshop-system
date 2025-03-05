from typing import Any, List, Optional
from datetime import datetime, date
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status, Body
from sqlalchemy import or_, and_, func, extract
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operations import Customer, Loan, Item
from app.models.users import User
from app.schemas.customers import (
    Customer as CustomerSchema,
    CustomerCreate,
    CustomerUpdate,
    CustomerSearchParams,
    CustomerStats
)
from app.core.security import get_current_user_with_cookie

router = APIRouter()


def generate_customer_code() -> str:
    """Generate a unique customer code"""
    # Format: C-xxxxxxxx (8 random alphanumeric characters)
    return f"C-{uuid.uuid4().hex[:8].upper()}"


@router.get("/", response_model=List[CustomerSchema])
def read_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Any:
    """
    Retrieve customers with optional filtering.
    """
    query = db.query(Customer)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Customer.first_name.ilike(search_term),
                Customer.last_name.ilike(search_term),
                Customer.email.ilike(search_term),
                Customer.phone.ilike(search_term),
                Customer.customer_code.ilike(search_term)
            )
        )
    
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
    
    # Apply pagination
    customers = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
    
    return customers


@router.post("/", response_model=CustomerSchema)
def create_customer(
    *,
    db: Session = Depends(get_db),
    customer_in: CustomerCreate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create new customer.
    """
    # Check if customer with this email or phone exists
    existing_customer = db.query(Customer).filter(
        or_(
            Customer.email == customer_in.email,
            Customer.phone == customer_in.phone
        )
    ).first()
    
    if existing_customer:
        raise HTTPException(
            status_code=400,
            detail="A customer with this email or phone number already exists."
        )
    
    # Generate customer code if not provided
    customer_code = customer_in.customer_code or generate_customer_code()
    
    # Create customer
    db_customer = Customer(
        **customer_in.dict(exclude={"customer_code"}),
        customer_code=customer_code,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return db_customer


@router.get("/{customer_id}", response_model=CustomerSchema)
def read_customer(
    *,
    db: Session = Depends(get_db),
    customer_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get customer by ID.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    return customer


@router.put("/{customer_id}", response_model=CustomerSchema)
def update_customer(
    *,
    db: Session = Depends(get_db),
    customer_id: int = Path(..., gt=0),
    customer_in: CustomerUpdate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update a customer.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    # Check if email is being updated and already exists
    if customer_in.email and customer_in.email != customer.email:
        existing_customer = db.query(Customer).filter(
            Customer.email == customer_in.email
        ).first()
        
        if existing_customer:
            raise HTTPException(
                status_code=400,
                detail="A customer with this email already exists."
            )
    
    # Check if phone is being updated and already exists
    if customer_in.phone and customer_in.phone != customer.phone:
        existing_customer = db.query(Customer).filter(
            Customer.phone == customer_in.phone
        ).first()
        
        if existing_customer:
            raise HTTPException(
                status_code=400,
                detail="A customer with this phone number already exists."
            )
    
    # Update customer data
    update_data = customer_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    customer.updated_at = datetime.utcnow()
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return customer


@router.delete("/{customer_id}", response_model=CustomerSchema)
def delete_customer(
    *,
    db: Session = Depends(get_db),
    customer_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Delete a customer.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    # Check if customer has active loans
    active_loans = db.query(Loan).filter(
        and_(
            Loan.customer_id == customer_id,
            Loan.status.in_(["active", "overdue"])
        )
    ).count()
    
    if active_loans > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete customer with {active_loans} active loans"
        )
    
    # Instead of hard delete, mark as inactive
    customer.is_active = False
    customer.updated_at = datetime.utcnow()
    
    db.add(customer)
    db.commit()
    
    return customer


@router.post("/search", response_model=List[CustomerSchema])
def search_customers(
    *,
    db: Session = Depends(get_db),
    search_params: CustomerSearchParams,
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Advanced search for customers.
    """
    query = db.query(Customer)
    
    # Apply search filters
    if search_params.search_term:
        search_term = f"%{search_params.search_term}%"
        query = query.filter(
            or_(
                Customer.first_name.ilike(search_term),
                Customer.last_name.ilike(search_term),
                Customer.email.ilike(search_term),
                Customer.phone.ilike(search_term),
                Customer.customer_code.ilike(search_term)
            )
        )
    
    if search_params.email:
        query = query.filter(Customer.email == search_params.email)
    
    if search_params.phone:
        query = query.filter(Customer.phone == search_params.phone)
    
    if search_params.customer_code:
        query = query.filter(Customer.customer_code == search_params.customer_code)
    
    if search_params.is_active is not None:
        query = query.filter(Customer.is_active == search_params.is_active)
    
    if search_params.city:
        query = query.filter(Customer.city == search_params.city)
    
    if search_params.state:
        query = query.filter(Customer.state == search_params.state)
    
    # Apply pagination
    customers = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
    
    return customers


@router.get("/stats/overview", response_model=CustomerStats)
def get_customer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get customer statistics.
    """
    # Get current date
    today = date.today()
    current_year = today.year
    current_month = today.month
    
    # Total customers
    total_customers = db.query(func.count(Customer.id)).scalar()
    
    # Active/inactive customers
    active_customers = db.query(func.count(Customer.id)).filter(Customer.is_active == True).scalar()
    inactive_customers = db.query(func.count(Customer.id)).filter(Customer.is_active == False).scalar()
    
    # Customers with active loans
    customers_with_active_loans = db.query(func.count(Customer.id.distinct())).join(
        Loan, Loan.customer_id == Customer.id
    ).filter(Loan.status == "active").scalar()
    
    # Customers with completed loans
    customers_with_completed_loans = db.query(func.count(Customer.id.distinct())).join(
        Loan, Loan.customer_id == Customer.id
    ).filter(Loan.status == "completed").scalar()
    
    # Customers with defaulted loans
    customers_with_defaulted_loans = db.query(func.count(Customer.id.distinct())).join(
        Loan, Loan.customer_id == Customer.id
    ).filter(Loan.status == "defaulted").scalar()
    
    # New customers this month/year
    new_customers_this_month = db.query(func.count(Customer.id)).filter(
        and_(
            extract('year', Customer.created_at) == current_year,
            extract('month', Customer.created_at) == current_month
        )
    ).scalar()
    
    new_customers_this_year = db.query(func.count(Customer.id)).filter(
        extract('year', Customer.created_at) == current_year
    ).scalar()
    
    # Top customers by loan count
    top_customers_by_loan_count = db.query(Customer).join(
        Loan, Loan.customer_id == Customer.id
    ).group_by(Customer.id).order_by(
        func.count(Loan.id).desc()
    ).limit(5).all()
    
    # Top customers by loan amount
    top_customers_by_loan_amount = db.query(Customer).join(
        Loan, Loan.customer_id == Customer.id
    ).group_by(Customer.id).order_by(
        func.sum(Loan.loan_amount).desc()
    ).limit(5).all()
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": inactive_customers,
        "customers_with_active_loans": customers_with_active_loans,
        "customers_with_completed_loans": customers_with_completed_loans,
        "customers_with_defaulted_loans": customers_with_defaulted_loans,
        "new_customers_this_month": new_customers_this_month,
        "new_customers_this_year": new_customers_this_year,
        "top_customers_by_loan_count": top_customers_by_loan_count,
        "top_customers_by_loan_amount": top_customers_by_loan_amount
    } 