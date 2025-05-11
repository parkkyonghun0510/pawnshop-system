from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import shutil
from datetime import datetime
import uuid

from app.database import get_async_db
from app.models.loan_application import ApplicationDocument, ApplicationDocumentType
from app.models.operations import Application
from app.models.users import User
from app.schemas.operations import ApplicationDocument as ApplicationDocumentSchema
from app.schemas.operations import ApplicationDocumentCreate
from app.core.security import get_current_user_with_cookie
from app.core.config import settings

router = APIRouter(
    prefix="/applications/{application_id}/documents",
    tags=["application-documents"],
    dependencies=[Depends(get_current_user_with_cookie)],
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
        404: {"description": "Resource not found"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"}
    }
)

# Define upload directory
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "application_documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[ApplicationDocumentSchema])
async def get_application_documents(
    application_id: int = Path(..., description="ID of the application"),
    document_type: Optional[ApplicationDocumentType] = Query(None, description="Filter by document type"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Get all documents for a specific application"""
    # Check if application exists
    result = await db.execute(select(Application).filter(Application.id == application_id))
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Build query for documents
    query = select(ApplicationDocument).filter(ApplicationDocument.application_id == application_id)
    if document_type:
        query = query.filter(ApplicationDocument.document_type == document_type)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    return documents

@router.post("/", response_model=ApplicationDocumentSchema, status_code=status.HTTP_201_CREATED)
async def upload_application_document(
    application_id: int = Path(..., description="ID of the application"),
    document_type: ApplicationDocumentType = Form(..., description="Type of document"),
    notes: Optional[str] = Form(None, description="Notes about the document"),
    file: UploadFile = File(..., description="Document file to upload"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Upload a new document for an application"""
    # Check if application exists
    result = await db.execute(select(Application).filter(Application.id == application_id))
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create directory for this application if it doesn't exist
    application_dir = os.path.join(UPLOAD_DIR, str(application_id))
    os.makedirs(application_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(application_dir, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create document record
    db_document = ApplicationDocument(
        application_id=application_id,
        document_type=document_type,
        file_name=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        mime_type=file.content_type,
        uploaded_by_id=current_user.id,
        notes=notes
    )
    
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    
    return db_document

@router.get("/{document_id}", response_model=ApplicationDocumentSchema)
async def get_application_document(
    application_id: int = Path(..., description="ID of the application"),
    document_id: int = Path(..., description="ID of the document"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Get a specific document for an application"""
    result = await db.execute(
        select(ApplicationDocument).filter(
            ApplicationDocument.id == document_id,
            ApplicationDocument.application_id == application_id
        )
    )
    document = result.scalars().first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application_document(
    application_id: int = Path(..., description="ID of the application"),
    document_id: int = Path(..., description="ID of the document"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_with_cookie)
):
    """Delete a document from an application"""
    result = await db.execute(
        select(ApplicationDocument).filter(
            ApplicationDocument.id == document_id,
            ApplicationDocument.application_id == application_id
        )
    )
    document = result.scalars().first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    try:
        os.remove(document.file_path)
    except OSError:
        # Log error but continue with database deletion
        print(f"Error deleting file: {document.file_path}")
    
    # Delete from database
    await db.delete(document)
    await db.commit()
    
    return None
