"""
Pydantic schemas for the mail ingest service.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr


class EmailBase(BaseModel):
    """Base schema for email data."""
    
    from_email: EmailStr
    to_email: EmailStr
    subject: str
    body: str


class EmailCreate(EmailBase):
    """Schema for creating a new email."""
    
    pass


class EmailResponse(EmailBase):
    """Schema for email response."""
    
    id: int
    message_id: str
    received_date: datetime
    processed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AttachmentBase(BaseModel):
    """Base schema for attachment data."""
    
    filename: str
    content_type: str


class AttachmentCreate(AttachmentBase):
    """Schema for creating a new attachment."""
    
    file_path: str


class AttachmentResponse(AttachmentBase):
    """Schema for attachment response."""
    
    id: int
    email_id: int
    file_path: str
    created_at: datetime

    class Config:
        orm_mode = True


class ProcessedAttachmentBase(BaseModel):
    """Base schema for processed attachment data."""
    
    success: bool
    text_content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    entities: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    confidence: float = 0.0
    error_message: Optional[str] = None
    supabase_path: Optional[str] = None
    public_url: Optional[str] = None


class ProcessedAttachmentCreate(ProcessedAttachmentBase):
    """Schema for creating a new processed attachment."""
    
    attachment_id: int


class ProcessedAttachmentResponse(ProcessedAttachmentBase):
    """Schema for processed attachment response."""
    
    id: int
    attachment_id: int
    processed_at: datetime

    class Config:
        orm_mode = True


class EmailWithAttachments(EmailResponse):
    """Schema for email with attachments."""
    
    attachments: List[AttachmentResponse] = []

    class Config:
        orm_mode = True


class AttachmentWithProcessedData(AttachmentResponse):
    """Schema for attachment with processed data."""
    
    processed_data: Optional[ProcessedAttachmentResponse] = None

    class Config:
        orm_mode = True


class EmailWithProcessedAttachments(EmailResponse):
    """Schema for email with processed attachments."""
    
    attachments: List[AttachmentWithProcessedData] = []

    class Config:
        orm_mode = True