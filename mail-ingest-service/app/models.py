"""
Database models for the mail ingest service.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Email(Base):
    """Email model for storing email information."""
    
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True)
    from_email = Column(String)
    to_email = Column(String)
    subject = Column(String)
    body = Column(Text)
    received_date = Column(DateTime)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Attachment(Base):
    """Attachment model for storing attachment information."""
    
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    filename = Column(String)
    content_type = Column(String)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessedAttachment(Base):
    """ProcessedAttachment model for storing processed attachment data."""
    
    __tablename__ = "processed_attachments"

    id = Column(Integer, primary_key=True, index=True)
    attachment_id = Column(Integer, ForeignKey("attachments.id"))
    success = Column(Boolean, default=False)
    text_content = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    entities = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)
    confidence = Column(Float, default=0.0)
    error_message = Column(String, nullable=True)
    supabase_path = Column(String, nullable=True)
    public_url = Column(String, nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)