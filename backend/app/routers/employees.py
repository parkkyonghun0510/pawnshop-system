from typing import List, Optional, Any, Dict
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, String
from sqlalchemy.sql import label
from sqlalchemy.sql.expression import or_

from app.database import get_db
from app.models.organization import Employee, EmployeeType, Branch
from app.models.users import User
from app.schemas.employees import (
    Employee as EmployeeSchema,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeWithDetails,
    EmployeeSearchParams,
    EmployeeStats,
    EmployeeType as EmployeeTypeSchema,
    EmployeeTypeCreate,
    EmployeeTypeUpdate
)
from app.core.security import get_current_user_with_cookie

router = APIRouter(
    prefix="/employees",
    tags=["employees"],
    dependencies=[Depends(get_current_user_with_cookie)]
)


@router.get("/", response_model=List[EmployeeWithDetails])
def read_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100,
    branch_id: Optional[int] = None,
    employee_type_id: Optional[int] = None,
    is_active: Optional[bool] = None
) -> Any:
    """
    Retrieve employees with optional filtering.
    """
    # Check if user has permission to view employees
    query = db.query(
        Employee, 
        User.username, 
        User.email, 
        Branch.name.label("branch_name"), 
        EmployeeType.name.label("employee_type_name"),
        User.is_active
    ).join(
        User, Employee.user_id == User.id
    ).join(
        Branch, Employee.branch_id == Branch.id
    ).join(
        EmployeeType, Employee.employee_type_id == EmployeeType.id
    )

    # Apply filters if provided
    if branch_id is not None:
        query = query.filter(Employee.branch_id == branch_id)
    
    if employee_type_id is not None:
        query = query.filter(Employee.employee_type_id == employee_type_id)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Get paginated results
    employees_data = query.offset(skip).limit(limit).all()
    
    # Format response
    result = []
    for employee, username, email, branch_name, employee_type_name, is_active in employees_data:
        employee_dict = {
            "id": employee.id,
            "user_id": employee.user_id,
            "branch_id": employee.branch_id,
            "employee_type_id": employee.employee_type_id,
            "hire_date": employee.hire_date,
            "created_at": employee.created_at,
            "updated_at": employee.updated_at,
            "username": username,
            "email": email,
            "branch_name": branch_name,
            "employee_type_name": employee_type_name,
            "is_active": is_active
        }
        result.append(employee_dict)
    
    return result


@router.post("/", response_model=EmployeeSchema)
def create_employee(
    *,
    db: Session = Depends(get_db),
    employee_in: EmployeeCreate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create a new employee.
    """
    # Check if user and branch exist
    user = db.query(User).filter(User.id == employee_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    branch = db.query(Branch).filter(Branch.id == employee_in.branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    employee_type = db.query(EmployeeType).filter(EmployeeType.id == employee_in.employee_type_id).first()
    if not employee_type:
        raise HTTPException(status_code=404, detail="Employee type not found")
    
    # Check if employee record already exists for this user
    existing_employee = db.query(Employee).filter(Employee.user_id == employee_in.user_id).first()
    if existing_employee:
        raise HTTPException(status_code=400, detail="Employee record already exists for this user")
    
    # Create new employee
    employee = Employee(
        user_id=employee_in.user_id,
        branch_id=employee_in.branch_id,
        employee_type_id=employee_in.employee_type_id,
        hire_date=employee_in.hire_date
    )
    
    db.add(employee)
    db.commit()
    db.refresh(employee)
    
    return employee


@router.get("/{employee_id}", response_model=EmployeeWithDetails)
def read_employee(
    *,
    db: Session = Depends(get_db),
    employee_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get employee by ID.
    """
    # Get employee with details
    employee_data = db.query(
        Employee, 
        User.username, 
        User.email, 
        Branch.name.label("branch_name"), 
        EmployeeType.name.label("employee_type_name"),
        User.is_active
    ).join(
        User, Employee.user_id == User.id
    ).join(
        Branch, Employee.branch_id == Branch.id
    ).join(
        EmployeeType, Employee.employee_type_id == EmployeeType.id
    ).filter(
        Employee.id == employee_id
    ).first()
    
    if not employee_data:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee, username, email, branch_name, employee_type_name, is_active = employee_data
    
    # Format response
    employee_dict = {
        "id": employee.id,
        "user_id": employee.user_id,
        "branch_id": employee.branch_id,
        "employee_type_id": employee.employee_type_id,
        "hire_date": employee.hire_date,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
        "username": username,
        "email": email,
        "branch_name": branch_name,
        "employee_type_name": employee_type_name,
        "is_active": is_active
    }
    
    return employee_dict


@router.put("/{employee_id}", response_model=EmployeeSchema)
def update_employee(
    *,
    db: Session = Depends(get_db),
    employee_id: int = Path(..., gt=0),
    employee_in: EmployeeUpdate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update an employee.
    """
    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = employee_in.dict(exclude_unset=True)
    
    # Check if branch exists if branch_id is provided
    if "branch_id" in update_data:
        branch = db.query(Branch).filter(Branch.id == update_data["branch_id"]).first()
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check if employee type exists if employee_type_id is provided
    if "employee_type_id" in update_data:
        employee_type = db.query(EmployeeType).filter(EmployeeType.id == update_data["employee_type_id"]).first()
        if not employee_type:
            raise HTTPException(status_code=404, detail="Employee type not found")
    
    # Update is_active status on the user if provided
    if "is_active" in update_data:
        is_active = update_data.pop("is_active")
        user = db.query(User).filter(User.id == employee.user_id).first()
        user.is_active = is_active
    
    # Update employee
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    db.commit()
    db.refresh(employee)
    
    return employee


@router.delete("/{employee_id}", response_model=EmployeeSchema)
def delete_employee(
    *,
    db: Session = Depends(get_db),
    employee_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Delete an employee.
    """
    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # We should check if there are any related records before deleting
    # For example, any transactions processed by this employee, etc.
    # For now, we'll just set the associated user to inactive instead of deleting
    user = db.query(User).filter(User.id == employee.user_id).first()
    if user:
        user.is_active = False
        db.commit()
    
    # Remove employee record
    db.delete(employee)
    db.commit()
    
    return employee


@router.post("/search", response_model=List[EmployeeWithDetails])
def search_employees(
    *,
    db: Session = Depends(get_db),
    search_params: EmployeeSearchParams,
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Search employees with advanced filters.
    """
    # Base query
    query = db.query(
        Employee, 
        User.username, 
        User.email, 
        Branch.name.label("branch_name"), 
        EmployeeType.name.label("employee_type_name"),
        User.is_active
    ).join(
        User, Employee.user_id == User.id
    ).join(
        Branch, Employee.branch_id == Branch.id
    ).join(
        EmployeeType, Employee.employee_type_id == EmployeeType.id
    )
    
    # Apply search filters
    if search_params.search_term:
        search_term = f"%{search_params.search_term}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    if search_params.branch_id is not None:
        query = query.filter(Employee.branch_id == search_params.branch_id)
    
    if search_params.employee_type_id is not None:
        query = query.filter(Employee.employee_type_id == search_params.employee_type_id)
    
    if search_params.is_active is not None:
        query = query.filter(User.is_active == search_params.is_active)
    
    if search_params.hire_date_from is not None:
        query = query.filter(Employee.hire_date >= search_params.hire_date_from)
    
    if search_params.hire_date_to is not None:
        query = query.filter(Employee.hire_date <= search_params.hire_date_to)
    
    # Get paginated results
    employees_data = query.offset(skip).limit(limit).all()
    
    # Format response
    result = []
    for employee, username, email, branch_name, employee_type_name, is_active in employees_data:
        employee_dict = {
            "id": employee.id,
            "user_id": employee.user_id,
            "branch_id": employee.branch_id,
            "employee_type_id": employee.employee_type_id,
            "hire_date": employee.hire_date,
            "created_at": employee.created_at,
            "updated_at": employee.updated_at,
            "username": username,
            "email": email,
            "branch_name": branch_name,
            "employee_type_name": employee_type_name,
            "is_active": is_active
        }
        result.append(employee_dict)
    
    return result


@router.get("/stats/overview", response_model=EmployeeStats)
def get_employee_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get employee statistics.
    """
    # Total employees
    total_employees = db.query(func.count(Employee.id)).scalar()
    
    # Active employees
    active_employees = db.query(func.count(Employee.id)).join(
        User, Employee.user_id == User.id
    ).filter(
        User.is_active == True
    ).scalar()
    
    # Employees by branch
    employees_by_branch_query = db.query(
        Branch.name,
        func.count(Employee.id).label("count")
    ).join(
        Employee, Branch.id == Employee.branch_id
    ).group_by(
        Branch.name
    ).all()
    
    employees_by_branch = {branch: count for branch, count in employees_by_branch_query}
    
    # Employees by type
    employees_by_type_query = db.query(
        EmployeeType.name,
        func.count(Employee.id).label("count")
    ).join(
        Employee, EmployeeType.id == Employee.employee_type_id
    ).group_by(
        EmployeeType.name
    ).all()
    
    employees_by_type = {emp_type: count for emp_type, count in employees_by_type_query}
    
    # Employees by hire month
    current_year = datetime.now().year
    employees_by_month_query = db.query(
        extract('month', Employee.hire_date).label("month"),
        func.count(Employee.id).label("count")
    ).filter(
        extract('year', Employee.hire_date) == current_year
    ).group_by(
        extract('month', Employee.hire_date)
    ).all()
    
    # Create list for all months (1-12)
    employees_by_hire_month = []
    for month in range(1, 13):
        month_data = {
            "month": month,
            "month_name": date(1900, month, 1).strftime('%B'),
            "count": 0
        }
        
        # Update count if we have data for this month
        for result_month, count in employees_by_month_query:
            if result_month == month:
                month_data["count"] = count
                break
        
        employees_by_hire_month.append(month_data)
    
    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "employees_by_branch": employees_by_branch,
        "employees_by_type": employees_by_type,
        "employees_by_hire_month": employees_by_hire_month
    }


# Employee Type Endpoints
@router.get("/types/", response_model=List[EmployeeTypeSchema])
def read_employee_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve all employee types.
    """
    employee_types = db.query(EmployeeType).offset(skip).limit(limit).all()
    return employee_types


@router.post("/types/", response_model=EmployeeTypeSchema)
def create_employee_type(
    *,
    db: Session = Depends(get_db),
    employee_type_in: EmployeeTypeCreate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Create a new employee type.
    """
    # Check if employee type with this name already exists
    existing_type = db.query(EmployeeType).filter(
        func.lower(EmployeeType.name) == func.lower(employee_type_in.name)
    ).first()
    
    if existing_type:
        raise HTTPException(status_code=400, detail="Employee type with this name already exists")
    
    # Create new employee type
    employee_type = EmployeeType(**employee_type_in.dict())
    
    db.add(employee_type)
    db.commit()
    db.refresh(employee_type)
    
    return employee_type


@router.get("/types/{employee_type_id}", response_model=EmployeeTypeSchema)
def read_employee_type(
    *,
    db: Session = Depends(get_db),
    employee_type_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Get an employee type by ID.
    """
    employee_type = db.query(EmployeeType).filter(EmployeeType.id == employee_type_id).first()
    if not employee_type:
        raise HTTPException(status_code=404, detail="Employee type not found")
    
    return employee_type


@router.put("/types/{employee_type_id}", response_model=EmployeeTypeSchema)
def update_employee_type(
    *,
    db: Session = Depends(get_db),
    employee_type_id: int = Path(..., gt=0),
    employee_type_in: EmployeeTypeUpdate,
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Update an employee type.
    """
    employee_type = db.query(EmployeeType).filter(EmployeeType.id == employee_type_id).first()
    if not employee_type:
        raise HTTPException(status_code=404, detail="Employee type not found")
    
    update_data = employee_type_in.dict(exclude_unset=True)
    
    # If updating name, check that it doesn't conflict
    if "name" in update_data and update_data["name"] != employee_type.name:
        existing_type = db.query(EmployeeType).filter(
            func.lower(EmployeeType.name) == func.lower(update_data["name"])
        ).first()
        
        if existing_type:
            raise HTTPException(status_code=400, detail="Employee type with this name already exists")
    
    # Update fields
    for field, value in update_data.items():
        setattr(employee_type, field, value)
    
    db.commit()
    db.refresh(employee_type)
    
    return employee_type


@router.delete("/types/{employee_type_id}", response_model=EmployeeTypeSchema)
def delete_employee_type(
    *,
    db: Session = Depends(get_db),
    employee_type_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user_with_cookie)
) -> Any:
    """
    Delete an employee type.
    """
    employee_type = db.query(EmployeeType).filter(EmployeeType.id == employee_type_id).first()
    if not employee_type:
        raise HTTPException(status_code=404, detail="Employee type not found")
    
    # Check if there are any employees using this type
    employee_count = db.query(func.count(Employee.id)).filter(
        Employee.employee_type_id == employee_type_id
    ).scalar()
    
    if employee_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete employee type that is assigned to {employee_count} employees"
        )
    
    # Delete the employee type
    db.delete(employee_type)
    db.commit()
    
    return employee_type 