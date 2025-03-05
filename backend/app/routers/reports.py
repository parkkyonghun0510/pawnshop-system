from typing import List, Optional, Dict, Any, Union
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, desc
from io import StringIO
import csv
import json
from pydantic import BaseModel, Field
import uuid

from app.database import get_db
from app.models.users import User
from app.models.operations import Loan, Payment, Item, ItemStatus, Customer, Transaction, TransactionType
from app.models.organization import Employee, Branch
from app.schemas.loans import LoanStatusEnum
from app.schemas.transactions import TransactionStatusEnum, PaymentMethodEnum
from app.core.security import get_current_user_with_cookie

router = APIRouter(
    tags=["reports"],
    dependencies=[Depends(get_current_user_with_cookie)]
)


class SalesReport(BaseModel):
    """Schema for sales report data"""
    total_sales: float
    total_transactions: int
    average_sale_value: float
    sales_by_date: List[Dict[str, Union[str, float, int]]]
    sales_by_payment_method: Dict[str, float]
    sales_by_branch: Dict[str, float]
    top_selling_items: List[Dict[str, Any]]


class LoanReport(BaseModel):
    """Schema for loan report data"""
    total_loans: int
    total_loan_amount: float
    total_interest_collected: float
    active_loans: int
    overdue_loans: int
    completed_loans: int
    defaulted_loans: int
    loans_by_date: List[Dict[str, Union[str, float, int]]]
    loans_by_branch: Dict[str, float]
    average_loan_amount: float
    average_loan_duration: float


class InventoryReport(BaseModel):
    """Schema for inventory report data"""
    total_items: int
    total_inventory_value: float
    items_by_status: Dict[str, int]
    items_by_category: Dict[str, int]
    items_by_branch: Dict[str, int]
    recently_acquired_items: List[Dict[str, Any]]
    highest_value_items: List[Dict[str, Any]]


class CustomerReport(BaseModel):
    """Schema for customer report data"""
    total_customers: int
    active_customers: int
    inactive_customers: int
    new_customers: int
    customers_by_branch: Dict[str, int]
    top_customers: List[Dict[str, Any]]
    customer_acquisition_by_date: List[Dict[str, Union[str, int]]]


class DashboardStats(BaseModel):
    """Schema for dashboard statistics"""
    total_loans: int
    active_loans: int
    total_loan_amount: float
    total_interest_earned: float
    total_sales: float
    sales_today: float
    total_inventory_value: float
    total_customers: int
    new_customers_this_month: int
    overdue_loans: int
    defaulted_loans: int
    revenue_by_day: List[Dict[str, Union[str, float]]]
    loan_applications_by_day: List[Dict[str, Union[str, int]]]


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    days: int = Query(30, description="Number of days to include in charts")
) -> Any:
    """
    Get dashboard statistics with aggregated data from all modules.
    """
    today = date.today()
    start_date = today - timedelta(days=days)
    
    # Get loan statistics
    loans_query = db.query(Loan)
    total_loans = loans_query.count()
    active_loans = loans_query.filter(Loan.status == LoanStatusEnum.ACTIVE).count()
    overdue_loans = loans_query.filter(Loan.status == LoanStatusEnum.OVERDUE).count()
    defaulted_loans = loans_query.filter(Loan.status == LoanStatusEnum.DEFAULTED).count()
    
    # Financial metrics
    total_loan_amount = db.query(func.sum(Loan.loan_amount)).scalar() or 0
    
    # Calculate interest earned from payments
    payments_sum = db.query(func.sum(Payment.amount)).scalar() or 0
    total_interest_earned = payments_sum - total_loan_amount if payments_sum > total_loan_amount else 0
    
    # Sales statistics
    sales_query = db.query(Transaction).filter(Transaction.transaction_type == TransactionType.SALE)
    total_sales = db.query(func.sum(Transaction.amount)).filter(
        Transaction.transaction_type == TransactionType.SALE
    ).scalar() or 0
    
    # Sales today
    sales_today = db.query(func.sum(Transaction.amount)).filter(
        Transaction.transaction_type == TransactionType.SALE,
        func.date(Transaction.transaction_date) == today
    ).scalar() or 0
    
    # Inventory value
    total_inventory_value = db.query(func.sum(Item.appraisal_value)).filter(
        Item.status.in_([ItemStatus.IN_INVENTORY, ItemStatus.FOR_SALE])
    ).scalar() or 0
    
    # Customer statistics
    customers_query = db.query(Customer)
    total_customers = customers_query.count()
    
    # New customers this month
    new_customers_this_month = customers_query.filter(
        extract('year', Customer.created_at) == today.year,
        extract('month', Customer.created_at) == today.month
    ).count()
    
    # Daily revenue chart data
    revenue_by_day = []
    loan_applications_by_day = []
    
    for i in range(days):
        current_date = today - timedelta(days=days - i - 1)
        next_date = current_date + timedelta(days=1)
        
        # Revenue for the day
        daily_revenue = db.query(func.sum(Transaction.amount)).filter(
            Transaction.transaction_date >= current_date,
            Transaction.transaction_date < next_date
        ).scalar() or 0
        
        revenue_by_day.append({
            "date": current_date.isoformat(),
            "value": float(daily_revenue)
        })
        
        # Loan applications for the day
        daily_loans = db.query(func.count(Loan.id)).filter(
            func.date(Loan.created_at) == current_date
        ).scalar() or 0
        
        loan_applications_by_day.append({
            "date": current_date.isoformat(),
            "count": daily_loans
        })
    
    return {
        "total_loans": total_loans,
        "active_loans": active_loans,
        "total_loan_amount": total_loan_amount,
        "total_interest_earned": total_interest_earned,
        "total_sales": total_sales,
        "sales_today": sales_today,
        "total_inventory_value": total_inventory_value,
        "total_customers": total_customers,
        "new_customers_this_month": new_customers_this_month,
        "overdue_loans": overdue_loans,
        "defaulted_loans": defaulted_loans,
        "revenue_by_day": revenue_by_day,
        "loan_applications_by_day": loan_applications_by_day
    }


@router.get("/sales", response_model=SalesReport)
def get_sales_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    start_date: Optional[date] = Query(None, description="Start date for report"),
    end_date: Optional[date] = Query(None, description="End date for report"),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID")
) -> Any:
    """
    Generate a sales report with comprehensive statistics.
    """
    # Default date range if not provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Base query for sales transactions
    query = db.query(Transaction).filter(
        Transaction.transaction_type == TransactionType.SALE,
        func.date(Transaction.transaction_date) >= start_date,
        func.date(Transaction.transaction_date) <= end_date
    )
    
    # Apply branch filter if provided
    if branch_id:
        query = query.filter(Transaction.branch_id == branch_id)
    
    # Total sales and transactions
    total_sales = db.query(func.sum(Transaction.amount)).filter(query.whereclause).scalar() or 0
    total_transactions = query.count()
    average_sale_value = total_sales / total_transactions if total_transactions > 0 else 0
    
    # Sales by date
    sales_by_date_query = db.query(
        func.date(Transaction.transaction_date).label("date"),
        func.sum(Transaction.amount).label("amount"),
        func.count(Transaction.id).label("count")
    ).filter(query.whereclause).group_by(
        func.date(Transaction.transaction_date)
    ).order_by(
        func.date(Transaction.transaction_date)
    ).all()
    
    sales_by_date = [
        {
            "date": date.isoformat(),
            "amount": float(amount),
            "count": count
        }
        for date, amount, count in sales_by_date_query
    ]
    
    # Sales by payment method
    sales_by_payment_method = {
        "cash": 0.0,
        "credit_card": 0.0,
        "debit_card": 0.0,
        "bank_transfer": 0.0,
        "mobile_payment": 0.0,
        "check": 0.0,
        "other": 0.0
    }
    
    # We can still get transaction totals by branch
    sales_by_branch_query = db.query(
        Branch.name,
        func.sum(Transaction.amount).label("amount")
    ).join(
        Branch, Transaction.branch_id == Branch.id
    ).filter(query.whereclause).group_by(
        Branch.name
    ).all()
    
    sales_by_branch = {
        branch_name: float(amount)
        for branch_name, amount in sales_by_branch_query
    }
    
    # Top selling items
    top_selling_items_query = db.query(
        Item.name,
        Item.category,
        func.count(Transaction.id).label("transaction_count"),
        func.sum(Transaction.amount).label("total_amount")
    ).join(
        Transaction, Transaction.item_id == Item.id
    ).filter(query.whereclause).group_by(
        Item.id, Item.name, Item.category
    ).order_by(
        func.count(Transaction.id).desc()
    ).limit(10).all()
    
    top_selling_items = [
        {
            "name": name,
            "category": category,
            "transaction_count": transaction_count,
            "total_amount": float(total_amount)
        }
        for name, category, transaction_count, total_amount in top_selling_items_query
    ]
    
    return {
        "total_sales": total_sales,
        "total_transactions": total_transactions,
        "average_sale_value": average_sale_value,
        "sales_by_date": sales_by_date,
        "sales_by_payment_method": sales_by_payment_method,
        "sales_by_branch": sales_by_branch,
        "top_selling_items": top_selling_items
    }


@router.get("/loans", response_model=LoanReport)
def get_loan_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    start_date: Optional[date] = Query(None, description="Start date for report"),
    end_date: Optional[date] = Query(None, description="End date for report"),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID")
) -> Any:
    """
    Generate a loan report with comprehensive statistics.
    """
    # Default date range if not provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Base query for loans
    query = db.query(Loan).filter(
        func.date(Loan.created_at) >= start_date,
        func.date(Loan.created_at) <= end_date
    )
    
    # Apply branch filter if provided
    if branch_id:
        query = query.filter(Loan.branch_id == branch_id)
    
    # Total loans
    total_loans = query.count()
    total_loan_amount = db.query(func.sum(Loan.loan_amount)).filter(query.whereclause).scalar() or 0
    
    # Loans by status
    active_loans = query.filter(Loan.status == LoanStatusEnum.ACTIVE).count()
    overdue_loans = query.filter(Loan.status == LoanStatusEnum.OVERDUE).count()
    completed_loans = query.filter(Loan.status == LoanStatusEnum.COMPLETED).count()
    defaulted_loans = query.filter(Loan.status == LoanStatusEnum.DEFAULTED).count()
    
    # Calculate interest collected
    # This is an approximation - in a real system, you'd track interest vs principal
    total_interest_collected = db.query(func.sum(Payment.amount)).join(
        Loan, Payment.loan_id == Loan.id
    ).filter(query.whereclause).scalar() or 0
    
    # Adjust interest (subtract principal)
    total_interest_collected = max(0, total_interest_collected - total_loan_amount)
    
    # Loans by date
    loans_by_date_query = db.query(
        func.date(Loan.created_at).label("date"),
        func.sum(Loan.loan_amount).label("amount"),
        func.count(Loan.id).label("count")
    ).filter(query.whereclause).group_by(
        func.date(Loan.created_at)
    ).order_by(
        func.date(Loan.created_at)
    ).all()
    
    loans_by_date = [
        {
            "date": date.isoformat(),
            "amount": float(amount),
            "count": count
        }
        for date, amount, count in loans_by_date_query
    ]
    
    # Loans by branch
    loans_by_branch_query = db.query(
        Branch.name,
        func.sum(Loan.loan_amount).label("amount")
    ).join(
        Branch, Loan.branch_id == Branch.id
    ).filter(query.whereclause).group_by(
        Branch.name
    ).all()
    
    loans_by_branch = {
        branch_name: float(amount)
        for branch_name, amount in loans_by_branch_query
    }
    
    # Average metrics
    average_loan_amount = total_loan_amount / total_loans if total_loans > 0 else 0
    average_loan_duration = db.query(func.avg(Loan.term_days)).filter(query.whereclause).scalar() or 0
    
    return {
        "total_loans": total_loans,
        "total_loan_amount": total_loan_amount,
        "total_interest_collected": total_interest_collected,
        "active_loans": active_loans,
        "overdue_loans": overdue_loans,
        "completed_loans": completed_loans,
        "defaulted_loans": defaulted_loans,
        "loans_by_date": loans_by_date,
        "loans_by_branch": loans_by_branch,
        "average_loan_amount": average_loan_amount,
        "average_loan_duration": float(average_loan_duration)
    }


@router.get("/inventory", response_model=InventoryReport)
def get_inventory_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID")
) -> Any:
    """
    Generate an inventory report with comprehensive statistics.
    """
    # Base query for inventory
    query = db.query(Item)
    
    # Apply branch filter if provided
    if branch_id:
        query = query.filter(Item.branch_id == branch_id)
    
    # Total items and value
    total_items = query.count()
    total_inventory_value = db.query(func.sum(Item.appraisal_value)).filter(query.whereclause).scalar() or 0
    
    # Items by status
    items_by_status = {}
    for status in ItemStatus:
        count = query.filter(Item.status == status.value).count()
        items_by_status[status.value] = count
    
    # Items by category
    items_by_category_query = db.query(
        Item.category,
        func.count(Item.id).label("count")
    ).filter(query.whereclause).group_by(
        Item.category
    ).all()
    
    items_by_category = {
        category: count
        for category, count in items_by_category_query
    }
    
    # Items by branch
    items_by_branch_query = db.query(
        Branch.name,
        func.count(Item.id).label("count")
    ).join(
        Branch, Item.branch_id == Branch.id
    ).filter(query.whereclause).group_by(
        Branch.name
    ).all()
    
    items_by_branch = {
        branch_name: count
        for branch_name, count in items_by_branch_query
    }
    
    # Recently acquired items
    recently_acquired_items_query = query.order_by(desc(Item.created_at)).limit(10).all()
    
    recently_acquired_items = [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "status": item.status,
            "appraisal_value": item.appraisal_value,
            "created_at": item.created_at
        }
        for item in recently_acquired_items_query
    ]
    
    # Highest value items
    highest_value_items_query = query.order_by(desc(Item.appraisal_value)).limit(10).all()
    
    highest_value_items = [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "status": item.status,
            "appraisal_value": item.appraisal_value
        }
        for item in highest_value_items_query
    ]
    
    return {
        "total_items": total_items,
        "total_inventory_value": total_inventory_value,
        "items_by_status": items_by_status,
        "items_by_category": items_by_category,
        "items_by_branch": items_by_branch,
        "recently_acquired_items": recently_acquired_items,
        "highest_value_items": highest_value_items
    }


@router.get("/customers", response_model=CustomerReport)
def get_customer_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID")
) -> Any:
    """
    Generate a customer report with comprehensive statistics.
    """
    # Current date
    today = date.today()
    
    # Base query for customers
    query = db.query(Customer)
    
    # Apply branch filter if provided (using most frequent branch from loans)
    if branch_id:
        # This is a simplification - in a real system, you might store preferred branch with customer
        customer_ids = db.query(Loan.customer_id).filter(
            Loan.branch_id == branch_id
        ).distinct().subquery()
        
        query = query.filter(Customer.id.in_(customer_ids))
    
    # Total customers
    total_customers = query.count()
    
    # Active/inactive customers
    active_customers = query.filter(Customer.is_active == True).count()
    inactive_customers = query.filter(Customer.is_active == False).count()
    
    # New customers (last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    new_customers = query.filter(Customer.created_at >= thirty_days_ago).count()
    
    # Customers by branch (based on their loans)
    customers_by_branch_query = db.query(
        Branch.name,
        func.count(func.distinct(Loan.customer_id)).label("count")
    ).join(
        Loan, Loan.branch_id == Branch.id
    ).group_by(
        Branch.name
    ).all()
    
    customers_by_branch = {
        branch_name: count
        for branch_name, count in customers_by_branch_query
    }
    
    # Top customers by loan amount
    top_customers_query = db.query(
        Customer.id,
        Customer.first_name,
        Customer.last_name,
        Customer.email,
        Customer.phone,
        func.count(Loan.id).label("loan_count"),
        func.sum(Loan.loan_amount).label("total_loan_amount")
    ).join(
        Loan, Loan.customer_id == Customer.id
    ).group_by(
        Customer.id, Customer.first_name, Customer.last_name, Customer.email, Customer.phone
    ).order_by(
        func.sum(Loan.loan_amount).desc()
    ).limit(10).all()
    
    top_customers = [
        {
            "id": id,
            "name": f"{first_name} {last_name}",
            "email": email,
            "phone": phone,
            "loan_count": loan_count,
            "total_loan_amount": float(total_loan_amount)
        }
        for id, first_name, last_name, email, phone, loan_count, total_loan_amount in top_customers_query
    ]
    
    # Customer acquisition by month
    acquisition_by_date_query = db.query(
        extract('year', Customer.created_at).label("year"),
        extract('month', Customer.created_at).label("month"),
        func.count(Customer.id).label("count")
    ).filter(
        Customer.created_at >= today - timedelta(days=365)
    ).group_by(
        extract('year', Customer.created_at),
        extract('month', Customer.created_at)
    ).order_by(
        extract('year', Customer.created_at),
        extract('month', Customer.created_at)
    ).all()
    
    customer_acquisition_by_date = [
        {
            "date": f"{int(year)}-{int(month):02d}",
            "count": count
        }
        for year, month, count in acquisition_by_date_query
    ]
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": inactive_customers,
        "new_customers": new_customers,
        "customers_by_branch": customers_by_branch,
        "top_customers": top_customers,
        "customer_acquisition_by_date": customer_acquisition_by_date
    }


@router.get("/export/sales")
def export_sales_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    start_date: Optional[date] = Query(None, description="Start date for report"),
    end_date: Optional[date] = Query(None, description="End date for report"),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID")
) -> Any:
    """
    Export sales report data as CSV.
    """
    # Default date range if not provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Query for sales transactions with details
    query = db.query(
        Transaction.id,
        Transaction.transaction_number,
        func.date(Transaction.transaction_date),
        Transaction.amount,
        Branch.name.label("branch_name"),
        Customer.first_name,
        Customer.last_name,
        Item.name.label("item_name"),
        Item.category.label("item_category")
    ).join(
        Branch, Transaction.branch_id == Branch.id
    ).outerjoin(
        Customer, Transaction.customer_id == Customer.id
    ).outerjoin(
        Item, Transaction.item_id == Item.id
    ).filter(
        Transaction.transaction_type == TransactionType.SALE,
        func.date(Transaction.transaction_date) >= start_date,
        func.date(Transaction.transaction_date) <= end_date
    )
    
    # Apply branch filter if provided
    if branch_id:
        query = query.filter(Transaction.branch_id == branch_id)
    
    # Order by date
    query = query.order_by(Transaction.transaction_date)
    
    # Execute query
    sales_data = query.all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Transaction ID", 
        "Transaction Number", 
        "Date", 
        "Amount", 
        "Branch", 
        "Customer",
        "Item",
        "Category"
    ])
    
    # Write data
    for row in sales_data:
        writer.writerow([
            row.id,
            row.transaction_number,
            row[2].isoformat(),  # Date
            row.amount,
            row.branch_name,
            f"{row.first_name} {row.last_name}" if row.first_name else "N/A",
            row.item_name if row.item_name else "N/A",
            row.item_category if row.item_category else "N/A"
        ])
    
    # Return CSV as streaming response
    output.seek(0)
    
    filename = f"sales_report_{start_date}_{end_date}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )


@router.get("/export/loans")
def export_loan_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    start_date: Optional[date] = Query(None, description="Start date for report"),
    end_date: Optional[date] = Query(None, description="End date for report"),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID")
) -> Any:
    """
    Export loan report data as CSV.
    """
    # Default date range if not provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Query for loans with details
    query = db.query(
        Loan.id,
        Loan.loan_code,
        func.date(Loan.created_at).label("created_date"),
        Loan.start_date,
        Loan.due_date,
        Loan.loan_amount,
        Loan.interest_rate,
        Loan.status,
        Branch.name.label("branch_name"),
        Customer.first_name,
        Customer.last_name,
        Item.name.label("item_name"),
        Item.category.label("item_category")
    ).join(
        Branch, Loan.branch_id == Branch.id
    ).join(
        Customer, Loan.customer_id == Customer.id
    ).join(
        Item, Loan.item_id == Item.id
    ).filter(
        func.date(Loan.created_at) >= start_date,
        func.date(Loan.created_at) <= end_date
    )
    
    # Apply branch filter if provided
    if branch_id:
        query = query.filter(Loan.branch_id == branch_id)
    
    # Order by date
    query = query.order_by(Loan.created_at)
    
    # Execute query
    loan_data = query.all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Loan ID", 
        "Loan Code", 
        "Created Date", 
        "Start Date", 
        "Due Date", 
        "Loan Amount", 
        "Interest Rate (%)", 
        "Status", 
        "Branch", 
        "Customer",
        "Item",
        "Category"
    ])
    
    # Write data
    for row in loan_data:
        writer.writerow([
            row.id,
            row.loan_code,
            row.created_date.isoformat(),
            row.start_date.isoformat(),
            row.due_date.isoformat(),
            row.loan_amount,
            row.interest_rate,
            row.status,
            row.branch_name,
            f"{row.first_name} {row.last_name}",
            row.item_name,
            row.item_category
        ])
    
    # Return CSV as streaming response
    output.seek(0)
    
    filename = f"loan_report_{start_date}_{end_date}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    ) 