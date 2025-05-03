from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class EmailBase(BaseModel):
    subject: str
    body: str
    html_body: Optional[str] = None
    recipient: Optional[str] = None
    client_id: Optional[str] = None
    category: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class EmailCreate(EmailBase):
    pass

class EmailUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    html_body: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    client_id: Optional[str] = None

class EmailResponse(EmailBase):
    id: str
    sender: str
    status: str
    is_outgoing: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class TranscriptionBase(BaseModel):
    title: str
    audio_url: str
    client_id: Optional[str] = None
    duration: Optional[str] = None

class TranscriptionCreate(TranscriptionBase):
    pass

class TranscriptionUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    status: Optional[str] = None
    client_id: Optional[str] = None

class TranscriptionResponse(TranscriptionBase):
    id: str
    text: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True