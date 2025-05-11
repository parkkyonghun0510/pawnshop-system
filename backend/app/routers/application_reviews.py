from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database import get_async_db
from app.models.loan_application import ApplicationReview
from app.models.operations import Application, ApplicationStatus
from app.models.users import User
from app.schemas.operations import ApplicationReview as ApplicationReviewSchema
from app.schemas.operations import ApplicationReviewCreate, ApplicationReviewBase
from app.core.security import get_current_user_with_cookie

router = APIRouter(
    prefix="/applications/{application_id}/reviews",
    tags=["application-reviews"],
    dependencies=[Depends(get_current_user_with_cookie)],
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
        404: {"description": "Resource not found"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"}
    }
)

@router.get("/", response_model=List[ApplicationReviewSchema])
async def get_application_reviews(
    application_id: int = Path(..., description="ID of the application"),
    review_step: Optional[str] = Query(None, description="Filter by review step"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Get all reviews for a specific application"""
    # Check if application exists
    result = await db.execute(select(Application).filter(Application.id == application_id))
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Build query for reviews
    query = select(ApplicationReview).filter(ApplicationReview.application_id == application_id)
    if review_step:
        query = query.filter(ApplicationReview.review_step == review_step)
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    return reviews

@router.post("/", response_model=ApplicationReviewSchema, status_code=status.HTTP_201_CREATED)
async def create_application_review(
    application_id: int = Path(..., description="ID of the application"),
    review_data: ApplicationReviewBase = Body(..., description="Review data"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Create a new review for an application"""
    # Check if application exists
    result = await db.execute(select(Application).filter(Application.id == application_id))
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Create review record
    db_review = ApplicationReview(
        application_id=application_id,
        reviewer_id=current_user.id,
        review_step=review_data.review_step,
        status=review_data.status,
        comments=review_data.comments
    )
    
    db.add(db_review)
    
    # Update application status based on review
    if review_data.status == "approved" and review_data.review_step == "final_approval":
        application.status = ApplicationStatus.APPROVED
        application.processed_by_id = current_user.id
        application.processed_at = datetime.utcnow()
    elif review_data.status == "rejected":
        application.status = ApplicationStatus.REJECTED
        application.processed_by_id = current_user.id
        application.processed_at = datetime.utcnow()
        application.rejection_reason = review_data.comments
    
    await db.commit()
    await db.refresh(db_review)
    
    return db_review

@router.get("/{review_id}", response_model=ApplicationReviewSchema)
async def get_application_review(
    application_id: int = Path(..., description="ID of the application"),
    review_id: int = Path(..., description="ID of the review"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Get a specific review for an application"""
    result = await db.execute(
        select(ApplicationReview).filter(
            ApplicationReview.id == review_id,
            ApplicationReview.application_id == application_id
        )
    )
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return review

@router.put("/{review_id}", response_model=ApplicationReviewSchema)
async def update_application_review(
    application_id: int = Path(..., description="ID of the application"),
    review_id: int = Path(..., description="ID of the review"),
    review_data: ApplicationReviewBase = Body(..., description="Updated review data"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Update a specific review for an application"""
    # Check if review exists
    result = await db.execute(
        select(ApplicationReview).filter(
            ApplicationReview.id == review_id,
            ApplicationReview.application_id == application_id
        )
    )
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if reviewer is the current user
    if review.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own reviews")
    
    # Update review
    review.review_step = review_data.review_step
    review.status = review_data.status
    review.comments = review_data.comments
    
    # Update application status based on review
    result = await db.execute(select(Application).filter(Application.id == application_id))
    application = result.scalars().first()
    
    if review_data.status == "approved" and review_data.review_step == "final_approval":
        application.status = ApplicationStatus.APPROVED
        application.processed_by_id = current_user.id
        application.processed_at = datetime.utcnow()
    elif review_data.status == "rejected":
        application.status = ApplicationStatus.REJECTED
        application.processed_by_id = current_user.id
        application.processed_at = datetime.utcnow()
        application.rejection_reason = review_data.comments
    
    await db.commit()
    await db.refresh(review)
    
    return review
