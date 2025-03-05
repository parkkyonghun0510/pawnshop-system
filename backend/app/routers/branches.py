from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User
from app.models.organization import Branch
from app.schemas.branches import BranchCreate, BranchUpdate, BranchResponse
from app.core.security import get_current_user_with_cookie

router = APIRouter()

@router.get("/", response_model=List[BranchResponse])
def get_branches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Get list of branches"""
    branches = db.query(Branch).offset(skip).limit(limit).all()
    return branches

@router.get("/{branch_id}", response_model=BranchResponse)
def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Get a specific branch by ID"""
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.post("/", response_model=BranchResponse)
def create_branch(
    branch: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Create a new branch"""
    db_branch = Branch(**branch.model_dump())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.put("/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: int,
    branch_update: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Update a branch"""
    db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    for field, value in branch_update.model_dump(exclude_unset=True).items():
        setattr(db_branch, field, value)
    
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.delete("/{branch_id}")
def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Delete a branch"""
    db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    db.delete(db_branch)
    db.commit()
    return {"message": "Branch deleted successfully"} 