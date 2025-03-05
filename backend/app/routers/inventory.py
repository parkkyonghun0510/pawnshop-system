from typing import Any, List, Optional, Dict
from datetime import datetime, date
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body, status
from sqlalchemy import or_, and_, func, extract, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operations import Item, ItemStatus, ItemCategory, Customer, Loan
from app.models.users import User
from app.models.organization import Branch
from app.schemas.inventory import (
    Item as ItemSchema,
    ItemCreate,
    ItemUpdate,
    ItemSearchParams,
    ItemStats,
    ItemStatusEnum,
    ItemCategoryEnum
)
from app.core.security import get_current_user_with_cookie

router = APIRouter()


def generate_item_code() -> str:
    """Generate a unique item code"""
    # Format: I-xxxxxxxx (8 random alphanumeric characters)
    return f"I-{uuid.uuid4().hex[:8].upper()}"


@router.get("/", response_model=List[ItemSchema])
def read_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100,
    status: Optional[ItemStatusEnum] = None,
    category: Optional[ItemCategoryEnum] = None,
    search: Optional[str] = None
) -> Any:
    """
    Retrieve items with optional filtering.
    """
    query = db.query(Item)
    
    # Apply filters
    if status:
        query = query.filter(Item.status == status)
    
    if category:
        query = query.filter(Item.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Item.name.ilike(search_term),
                Item.description.ilike(search_term),
                Item.serial_number.ilike(search_term),
                Item.item_code.ilike(search_term)
            )
        )
    
    # Apply pagination
    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()
    
    return items


@router.post("/", response_model=ItemSchema)
def create_item(
    *,
    db: Session = Depends(get_db),
    item_in: ItemCreate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create new item.
    """
    # Check if customer exists if specified
    if item_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == item_in.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )
    
    # Check if branch exists if specified
    if item_in.branch_id:
        branch = db.query(Branch).filter(Branch.id == item_in.branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=404,
                detail="Branch not found"
            )
    
    # Generate item code
    item_code = generate_item_code()
    
    # Create item
    db_item = Item(
        item_code=item_code,
        name=item_in.name,
        description=item_in.description,
        category=item_in.category,
        status=item_in.status,
        serial_number=item_in.serial_number,
        appraisal_value=item_in.appraisal_value,
        selling_price=item_in.selling_price,
        condition=item_in.condition,
        notes=item_in.notes,
        customer_id=item_in.customer_id,
        branch_id=item_in.branch_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # TODO: Handle attributes and photos if needed
    
    return db_item


@router.get("/{item_id}", response_model=ItemSchema)
def read_item(
    *,
    db: Session = Depends(get_db),
    item_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get item by ID.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    
    return item


@router.put("/{item_id}", response_model=ItemSchema)
def update_item(
    *,
    db: Session = Depends(get_db),
    item_id: int = Path(..., gt=0),
    item_in: ItemUpdate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update an item.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    
    # Check if customer exists if being updated
    if item_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == item_in.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )
    
    # Check if branch exists if being updated
    if item_in.branch_id:
        branch = db.query(Branch).filter(Branch.id == item_in.branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=404,
                detail="Branch not found"
            )
    
    # Update item data
    update_data = item_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(item, field, value)
    
    item.updated_at = datetime.utcnow()
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/{item_id}", response_model=ItemSchema)
def delete_item(
    *,
    db: Session = Depends(get_db),
    item_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Delete an item.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    
    # Check if item is associated with an active loan
    active_loan = db.query(Loan).filter(
        and_(
            Loan.item_id == item_id,
            Loan.status.in_(["active", "overdue"])
        )
    ).first()
    
    if active_loan:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete item that is associated with an active loan"
        )
    
    db.delete(item)
    db.commit()
    
    return item


@router.post("/search", response_model=List[ItemSchema])
def search_items(
    *,
    db: Session = Depends(get_db),
    search_params: ItemSearchParams,
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Advanced search for items.
    """
    query = db.query(Item)
    
    # Apply search filters
    if search_params.search_term:
        search_term = f"%{search_params.search_term}%"
        query = query.filter(
            or_(
                Item.name.ilike(search_term),
                Item.description.ilike(search_term),
                Item.serial_number.ilike(search_term),
                Item.item_code.ilike(search_term)
            )
        )
    
    if search_params.category:
        query = query.filter(Item.category == search_params.category)
    
    if search_params.status:
        query = query.filter(Item.status == search_params.status)
    
    if search_params.min_value is not None:
        query = query.filter(Item.appraisal_value >= search_params.min_value)
    
    if search_params.max_value is not None:
        query = query.filter(Item.appraisal_value <= search_params.max_value)
    
    if search_params.customer_id:
        query = query.filter(Item.customer_id == search_params.customer_id)
    
    if search_params.branch_id:
        query = query.filter(Item.branch_id == search_params.branch_id)
    
    if search_params.created_after:
        query = query.filter(Item.created_at >= search_params.created_after)
    
    if search_params.created_before:
        query = query.filter(Item.created_at <= search_params.created_before)
    
    # Apply pagination
    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()
    
    return items


@router.get("/stats/overview", response_model=ItemStats)
def get_item_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get item statistics.
    """
    # Get current date
    today = date.today()
    current_year = today.year
    current_month = today.month
    
    # Total items
    total_items = db.query(func.count(Item.id)).scalar()
    
    # Items by status
    items_by_status = {}
    for status in ItemStatus:
        count = db.query(func.count(Item.id)).filter(Item.status == status.value).scalar()
        items_by_status[status.value] = count
    
    # Items by category
    items_by_category = {}
    for category in ItemCategory:
        count = db.query(func.count(Item.id)).filter(Item.category == category.value).scalar()
        items_by_category[category.value] = count
    
    # Total inventory value
    total_inventory_value = db.query(func.sum(Item.appraisal_value)).scalar() or 0
    
    # Average item value
    avg_item_value = total_inventory_value / total_items if total_items > 0 else 0
    
    # Items added this month
    items_added_this_month = db.query(func.count(Item.id)).filter(
        and_(
            extract('year', Item.created_at) == current_year,
            extract('month', Item.created_at) == current_month
        )
    ).scalar()
    
    # Items sold this month
    items_sold_this_month = db.query(func.count(Item.id)).filter(
        and_(
            Item.status == ItemStatus.SOLD.value,
            extract('year', Item.updated_at) == current_year,
            extract('month', Item.updated_at) == current_month
        )
    ).scalar()
    
    return {
        "total_items": total_items,
        "items_by_status": items_by_status,
        "items_by_category": items_by_category,
        "total_inventory_value": total_inventory_value,
        "avg_item_value": avg_item_value,
        "items_added_this_month": items_added_this_month,
        "items_sold_this_month": items_sold_this_month
    }


@router.put("/status/{item_id}", response_model=ItemSchema)
def update_item_status(
    *,
    db: Session = Depends(get_db),
    item_id: int = Path(..., gt=0),
    status: ItemStatusEnum = Body(..., embed=True),
    notes: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update item status.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    
    # Update status and notes
    item.status = status
    if notes:
        item.notes = notes
    
    item.updated_at = datetime.utcnow()
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item 