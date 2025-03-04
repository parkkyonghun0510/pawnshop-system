from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body, Response, Path
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func, extract
from app.database import get_db
from app.models.operations import Application, ApplicationStatus
from app.schemas.operations import ApplicationCreate, ApplicationUpdate, Application as ApplicationSchema
from app.routers.auth import get_current_user
from app.models.users import User
from datetime import datetime, date, timedelta
import uuid
import csv
from io import StringIO
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/applications",
    tags=["applications"],
    dependencies=[Depends(get_current_user)],
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
        404: {"description": "Resource not found"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"}
    }
)

class ApplicationStats(BaseModel):
    """Statistics about applications"""
    total_applications: int = Field(..., description="Total number of applications")
    pending_count: int = Field(..., description="Number of pending applications")
    approved_count: int = Field(..., description="Number of approved applications")
    rejected_count: int = Field(..., description="Number of rejected applications")
    cancelled_count: int = Field(..., description="Number of cancelled applications")
    total_value: float = Field(..., description="Total estimated value of all applications")
    total_loan_amount: float = Field(..., description="Total loan amount requested")
    average_loan_amount: float = Field(..., description="Average loan amount per application")
    average_interest_rate: float = Field(..., description="Average interest rate across all applications")
    average_term_months: float = Field(..., description="Average loan term in months")

class ApplicationTrend(BaseModel):
    """Daily application trends"""
    date: date = Field(..., description="Date of the trend data")
    count: int = Field(..., description="Number of applications for this date")
    total_value: float = Field(..., description="Total estimated value for this date")
    total_loan_amount: float = Field(..., description="Total loan amount for this date")

class BulkUpdateRequest(BaseModel):
    """Request model for bulk update operations"""
    application_ids: List[int] = Field(..., description="List of application IDs to update")
    update_data: ApplicationUpdate = Field(..., description="Data to update for the applications")

def generate_application_number():
    """Generate a unique application number in format: APP-YYYYMMDD-UUID"""
    return f"APP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"

@router.get("/", 
    response_model=List[ApplicationSchema],
    summary="List applications",
    description="""
    Retrieve a list of applications with advanced filtering and sorting capabilities.
    
    Features:
    - Pagination support
    - Multiple filter options
    - Text search
    - Value range filtering
    - Date range filtering
    - Flexible sorting
    """,
    responses={
        200: {
            "description": "List of applications retrieved successfully",
            "content": {
                "application/json": {
                    "example": [{
                        "id": 1,
                        "application_number": "APP-20240315-12345678",
                        "customer_id": 1,
                        "branch_id": 1,
                        "item_type_id": 1,
                        "item_description": "Gold ring",
                        "estimated_value": 1000.0,
                        "loan_amount": 800.0,
                        "interest_rate": 5.0,
                        "term_months": 3,
                        "status": "pending",
                        "created_at": "2024-03-15T10:00:00"
                    }]
                }
            }
        }
    }
)
async def get_applications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status"),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    min_value: Optional[float] = Query(None, description="Minimum estimated value"),
    max_value: Optional[float] = Query(None, description="Maximum estimated value"),
    min_loan: Optional[float] = Query(None, description="Minimum loan amount"),
    max_loan: Optional[float] = Query(None, description="Maximum loan amount"),
    start_date: Optional[date] = Query(None, description="Start date for filtering"),
    end_date: Optional[date] = Query(None, description="End date for filtering"),
    search: Optional[str] = Query(None, description="Search in application number, description, and notes"),
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|application_number|estimated_value|loan_amount)$", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order (ascending or descending)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of applications with advanced filtering and sorting"""
    query = db.query(Application)
    
    # Basic filters
    if status:
        query = query.filter(Application.status == status)
    if branch_id:
        query = query.filter(Application.branch_id == branch_id)
    if customer_id:
        query = query.filter(Application.customer_id == customer_id)
    
    # Value range filters
    if min_value is not None:
        query = query.filter(Application.estimated_value >= min_value)
    if max_value is not None:
        query = query.filter(Application.estimated_value <= max_value)
    if min_loan is not None:
        query = query.filter(Application.loan_amount >= min_loan)
    if max_loan is not None:
        query = query.filter(Application.loan_amount <= max_loan)
    
    # Date range filters
    if start_date:
        query = query.filter(Application.created_at >= start_date)
    if end_date:
        query = query.filter(Application.created_at <= end_date)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Application.application_number.ilike(search_term),
                Application.item_description.ilike(search_term),
                Application.notes.ilike(search_term)
            )
        )
    
    # Apply sorting
    sort_column = getattr(Application, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{application_id}", 
    response_model=ApplicationSchema,
    summary="Get application details",
    description="Retrieve detailed information about a specific application",
    responses={
        200: {
            "description": "Application details retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "application_number": "APP-20240315-12345678",
                        "customer_id": 1,
                        "branch_id": 1,
                        "item_type_id": 1,
                        "item_description": "Gold ring",
                        "estimated_value": 1000.0,
                        "loan_amount": 800.0,
                        "interest_rate": 5.0,
                        "term_months": 3,
                        "status": "pending",
                        "created_at": "2024-03-15T10:00:00"
                    }
                }
            }
        },
        404: {"description": "Application not found"}
    }
)
async def get_application(
    application_id: int = Path(..., description="ID of the application to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific application by ID"""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@router.post("/", 
    response_model=ApplicationSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create new application",
    description="Create a new application with the provided details",
    responses={
        201: {
            "description": "Application created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "application_number": "APP-20240315-12345678",
                        "customer_id": 1,
                        "branch_id": 1,
                        "item_type_id": 1,
                        "item_description": "Gold ring",
                        "estimated_value": 1000.0,
                        "loan_amount": 800.0,
                        "interest_rate": 5.0,
                        "term_months": 3,
                        "status": "pending",
                        "created_at": "2024-03-15T10:00:00"
                    }
                }
            }
        },
        422: {"description": "Validation error in request data"}
    }
)
async def create_application(
    application: ApplicationCreate = Body(..., description="Application details to create"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new application"""
    # Generate unique application number
    application_data = application.model_dump()
    application_data["application_number"] = generate_application_number()
    
    db_application = Application(**application_data)
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

@router.put("/{application_id}", 
    response_model=ApplicationSchema,
    summary="Update application",
    description="""
    Update an existing application's details.
    
    Features:
    - Status updates with processing tracking
    - Rejection reason validation
    - Partial updates supported
    - Automatic timestamp updates
    """,
    responses={
        200: {
            "description": "Application updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "application_number": "APP-20240315-12345678",
                        "status": "approved",
                        "processed_by_id": 1,
                        "processed_at": "2024-03-15T10:00:00",
                        "updated_at": "2024-03-15T10:00:00"
                    }
                }
            }
        },
        400: {"description": "Invalid update data or rejection reason missing"},
        404: {"description": "Application not found"}
    }
)
async def update_application(
    application_id: int = Path(..., description="ID of the application to update"),
    application_update: ApplicationUpdate = Body(..., description="Data to update"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing application"""
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = application_update.model_dump(exclude_unset=True)
    
    # If status is being updated, record who processed it and when
    if "status" in update_data and update_data["status"] != db_application.status:
        update_data["processed_by_id"] = current_user.id
        update_data["processed_at"] = datetime.utcnow()
        
        # If rejecting, ensure rejection reason is provided
        if update_data["status"] == ApplicationStatus.REJECTED and not update_data.get("rejection_reason"):
            raise HTTPException(
                status_code=400,
                detail="Rejection reason is required when rejecting an application"
            )
    
    for field, value in update_data.items():
        setattr(db_application, field, value)
        
    db.commit()
    db.refresh(db_application)
    return db_application

@router.delete("/{application_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete application",
    description="""
    Delete an application from the system.
    
    Features:
    - Validation of application status
    - Protection against deleting processed applications
    - Automatic cleanup of related records
    """,
    responses={
        204: {"description": "Application deleted successfully"},
        400: {"description": "Cannot delete processed applications"},
        404: {"description": "Application not found"}
    }
)
async def delete_application(
    application_id: int = Path(..., description="ID of the application to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an application"""
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Prevent deletion of processed applications
    if db_application.status != ApplicationStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete applications that have been processed"
        )
        
    db.delete(db_application)
    db.commit()
    return None

@router.post("/bulk-update", 
    response_model=List[ApplicationSchema],
    summary="Bulk update applications",
    description="""
    Update multiple applications in a single operation.
    
    Features:
    - Batch processing
    - Status tracking
    - Validation across all applications
    - Atomic operation
    """,
    responses={
        200: {
            "description": "Applications updated successfully",
            "content": {
                "application/json": {
                    "example": [{
                        "id": 1,
                        "application_number": "APP-20240315-12345678",
                        "status": "approved",
                        "processed_by_id": 1,
                        "processed_at": "2024-03-15T10:00:00"
                    }]
                }
            }
        },
        400: {"description": "Invalid update data or rejection reason missing"},
        404: {"description": "No applications found"}
    }
)
async def bulk_update_applications(
    request: BulkUpdateRequest = Body(..., description="Bulk update request data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk update multiple applications"""
    applications = db.query(Application).filter(Application.id.in_(request.application_ids)).all()
    if not applications:
        raise HTTPException(status_code=404, detail="No applications found")
    
    updated_applications = []
    for application in applications:
        update_dict = request.update_data.model_dump(exclude_unset=True)
        
        # If status is being updated, record who processed it and when
        if "status" in update_dict and update_dict["status"] != application.status:
            update_dict["processed_by_id"] = current_user.id
            update_dict["processed_at"] = datetime.utcnow()
            
            # If rejecting, ensure rejection reason is provided
            if update_dict["status"] == ApplicationStatus.REJECTED and not update_dict.get("rejection_reason"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Rejection reason is required when rejecting application {application.id}"
                )
        
        for field, value in update_dict.items():
            setattr(application, field, value)
        
        updated_applications.append(application)
    
    db.commit()
    for application in updated_applications:
        db.refresh(application)
    return updated_applications

@router.post("/bulk-delete", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Bulk delete applications",
    description="""
    Delete multiple applications in a single operation.
    
    Features:
    - Batch processing
    - Status validation
    - Atomic operation
    - Protection against deleting processed applications
    """,
    responses={
        204: {"description": "Applications deleted successfully"},
        400: {"description": "Cannot delete processed applications"},
        404: {"description": "No applications found"}
    }
)
async def bulk_delete_applications(
    application_ids: List[int] = Body(..., description="List of application IDs to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk delete multiple applications"""
    applications = db.query(Application).filter(Application.id.in_(application_ids)).all()
    if not applications:
        raise HTTPException(status_code=404, detail="No applications found")
    
    # Check if any applications are already processed
    processed_apps = [app.id for app in applications if app.status != ApplicationStatus.PENDING]
    if processed_apps:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete processed applications: {processed_apps}"
        )
    
    for application in applications:
        db.delete(application)
    
    db.commit()
    return None

@router.get("/stats", 
    response_model=ApplicationStats,
    summary="Get application statistics",
    description="""
    Retrieve comprehensive statistics about applications.
    
    Features:
    - Counts by status
    - Total and average values
    - Filtering by branch and date range
    """,
    responses={
        200: {
            "description": "Statistics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "total_applications": 100,
                        "pending_count": 30,
                        "approved_count": 50,
                        "rejected_count": 15,
                        "cancelled_count": 5,
                        "total_value": 100000.0,
                        "total_loan_amount": 80000.0,
                        "average_loan_amount": 800.0,
                        "average_interest_rate": 5.0,
                        "average_term_months": 3.0
                    }
                }
            }
        }
    }
)
async def get_application_stats(
    branch_id: Optional[int] = Query(None, description="Filter statistics by branch ID"),
    start_date: Optional[date] = Query(None, description="Start date for statistics"),
    end_date: Optional[date] = Query(None, description="End date for statistics"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get application statistics"""
    query = db.query(Application)
    
    if branch_id:
        query = query.filter(Application.branch_id == branch_id)
    if start_date:
        query = query.filter(Application.created_at >= start_date)
    if end_date:
        query = query.filter(Application.created_at <= end_date)
    
    # Get counts by status
    status_counts = db.query(
        Application.status,
        func.count(Application.id)
    ).filter(query.whereclause).group_by(Application.status).all()
    
    # Get value and loan statistics
    stats = db.query(
        func.count(Application.id).label('total_applications'),
        func.sum(Application.estimated_value).label('total_value'),
        func.sum(Application.loan_amount).label('total_loan_amount'),
        func.avg(Application.loan_amount).label('average_loan_amount'),
        func.avg(Application.interest_rate).label('average_interest_rate'),
        func.avg(Application.term_months).label('average_term_months')
    ).filter(query.whereclause).first()
    
    # Convert status counts to dictionary
    status_dict = {status: count for status, count in status_counts}
    
    return ApplicationStats(
        total_applications=stats.total_applications or 0,
        pending_count=status_dict.get(ApplicationStatus.PENDING, 0),
        approved_count=status_dict.get(ApplicationStatus.APPROVED, 0),
        rejected_count=status_dict.get(ApplicationStatus.REJECTED, 0),
        cancelled_count=status_dict.get(ApplicationStatus.CANCELLED, 0),
        total_value=float(stats.total_value or 0),
        total_loan_amount=float(stats.total_loan_amount or 0),
        average_loan_amount=float(stats.average_loan_amount or 0),
        average_interest_rate=float(stats.average_interest_rate or 0),
        average_term_months=float(stats.average_term_months or 0)
    )

@router.get("/trends", 
    response_model=List[ApplicationTrend],
    summary="Get application trends",
    description="""
    Retrieve daily application trends over a specified period.
    
    Features:
    - Daily counts and totals
    - Configurable time period
    - Branch-specific trends
    """,
    responses={
        200: {
            "description": "Trends retrieved successfully",
            "content": {
                "application/json": {
                    "example": [{
                        "date": "2024-03-15",
                        "count": 5,
                        "total_value": 5000.0,
                        "total_loan_amount": 4000.0
                    }]
                }
            }
        }
    }
)
async def get_application_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    branch_id: Optional[int] = Query(None, description="Filter trends by branch ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get application trends over time"""
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    query = db.query(
        func.date(Application.created_at).label('date'),
        func.count(Application.id).label('count'),
        func.sum(Application.estimated_value).label('total_value'),
        func.sum(Application.loan_amount).label('total_loan_amount')
    ).filter(
        Application.created_at >= start_date,
        Application.created_at <= end_date
    )
    
    if branch_id:
        query = query.filter(Application.branch_id == branch_id)
    
    trends = query.group_by(
        func.date(Application.created_at)
    ).order_by(
        func.date(Application.created_at)
    ).all()
    
    return [
        ApplicationTrend(
            date=trend.date,
            count=trend.count,
            total_value=float(trend.total_value or 0),
            total_loan_amount=float(trend.total_loan_amount or 0)
        )
        for trend in trends
    ]

@router.get("/export",
    summary="Export applications",
    description="""
    Export applications in CSV or JSON format.
    
    Features:
    - Multiple export formats
    - Filtering options
    - Date-stamped filenames
    - Comprehensive data fields
    """,
    responses={
        200: {
            "description": "Export completed successfully",
            "content": {
                "text/csv": {
                    "example": "Application Number,Customer ID,Branch ID,Item Type,Item Description,Estimated Value,Loan Amount,Interest Rate,Term Months,Status,Notes,Processed By,Processed At,Created At,Updated At\nAPP-20240315-12345678,1,1,1,Gold ring,1000.0,800.0,5.0,3,pending,,1,2024-03-15T10:00:00,2024-03-15T10:00:00,2024-03-15T10:00:00"
                },
                "application/json": {
                    "example": [{
                        "id": 1,
                        "application_number": "APP-20240315-12345678",
                        "customer_id": 1,
                        "branch_id": 1,
                        "item_type_id": 1,
                        "item_description": "Gold ring",
                        "estimated_value": 1000.0,
                        "loan_amount": 800.0,
                        "interest_rate": 5.0,
                        "term_months": 3,
                        "status": "pending",
                        "created_at": "2024-03-15T10:00:00"
                    }]
                }
            }
        }
    }
)
async def export_applications(
    format: str = Query("csv", regex="^(csv|json)$", description="Export format (csv or json)"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status"),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    start_date: Optional[date] = Query(None, description="Start date for export"),
    end_date: Optional[date] = Query(None, description="End date for export"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export applications in CSV or JSON format"""
    query = db.query(Application)
    
    if status:
        query = query.filter(Application.status == status)
    if branch_id:
        query = query.filter(Application.branch_id == branch_id)
    if start_date:
        query = query.filter(Application.created_at >= start_date)
    if end_date:
        query = query.filter(Application.created_at <= end_date)
    
    applications = query.all()
    
    if format == "csv":
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Application Number", "Customer ID", "Branch ID", "Item Type",
            "Item Description", "Estimated Value", "Loan Amount", "Interest Rate",
            "Term Months", "Status", "Notes", "Processed By", "Processed At",
            "Created At", "Updated At"
        ])
        
        # Write data
        for app in applications:
            writer.writerow([
                app.application_number,
                app.customer_id,
                app.branch_id,
                app.item_type_id,
                app.item_description,
                app.estimated_value,
                app.loan_amount,
                app.interest_rate,
                app.term_months,
                app.status,
                app.notes,
                app.processed_by_id,
                app.processed_at,
                app.created_at,
                app.updated_at
            ])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=applications_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    else:
        return applications 