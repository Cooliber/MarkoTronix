from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.communication import Email
from app.schemas.communication import EmailCreate, EmailResponse, EmailUpdate

router = APIRouter()

@router.post("/", response_model=EmailResponse)
async def create_email(
    email_in: EmailCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new email (outgoing).
    """
    email = Email(
        **email_in.dict(exclude_unset=True),
        is_outgoing=True,
    )
    
    db.add(email)
    db.commit()
    db.refresh(email)
    
    # Add background task to send email
    from app.utils.email import send_email
    background_tasks.add_task(
        send_email,
        recipient=email.recipient,
        subject=email.subject,
        body=email.body,
        html_body=email.html_body,
        attachments=email.attachments,
    )
    
    return email

@router.get("/", response_model=List[EmailResponse])
async def read_emails(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    category: Optional[str] = None,
    is_outgoing: Optional[bool] = None,
    client_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve emails with optional filtering.
    """
    query = db.query(Email)
    
    if status:
        query = query.filter(Email.status == status)
    
    if category:
        query = query.filter(Email.category == category)
    
    if is_outgoing is not None:
        query = query.filter(Email.is_outgoing == is_outgoing)
    
    if client_id:
        query = query.filter(Email.client_id == client_id)
    
    emails = query.order_by(Email.created_at.desc()).offset(skip).limit(limit).all()
    
    return emails

@router.get("/{email_id}", response_model=EmailResponse)
async def read_email(
    email_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific email by ID.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    
    # If email is unread, mark it as read
    if email.status == "unread" and not email.is_outgoing:
        email.status = "read"
        db.commit()
    
    return email

@router.put("/{email_id}", response_model=EmailResponse)
async def update_email(
    email_id: str,
    email_in: EmailUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an email.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    
    update_data = email_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(email, field, value)
    
    db.commit()
    db.refresh(email)
    
    return email

@router.delete("/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email(
    email_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an email.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    
    db.delete(email)
    db.commit()
    
    return None

@router.post("/{email_id}/reply", response_model=EmailResponse)
async def reply_to_email(
    email_id: str,
    email_in: EmailCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reply to an email.
    """
    original_email = db.query(Email).filter(Email.id == email_id).first()
    
    if not original_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    
    # Create reply email
    reply_email = Email(
        **email_in.dict(exclude_unset=True),
        is_outgoing=True,
        client_id=original_email.client_id,
        recipient=original_email.sender,
        subject=f"Re: {original_email.subject}" if not original_email.subject.startswith("Re:") else original_email.subject,
    )
    
    db.add(reply_email)
    
    # Update original email status
    original_email.status = "replied"
    
    db.commit()
    db.refresh(reply_email)
    
    # Add background task to send email
    from app.utils.email import send_email
    background_tasks.add_task(
        send_email,
        recipient=reply_email.recipient,
        subject=reply_email.subject,
        body=reply_email.body,
        html_body=reply_email.html_body,
        attachments=reply_email.attachments,
    )
    
    return reply_email

@router.post("/{email_id}/categorize", response_model=EmailResponse)
async def categorize_email(
    email_id: str,
    category: str = Query(..., description="Email category (lead, client, marketing, other)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Categorize an email.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    
    if category not in ["lead", "client", "marketing", "other"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category",
        )
    
    email.category = category
    db.commit()
    db.refresh(email)
    
    return email