from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Email(Base):
    __tablename__ = "emails"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=True)
    subject = Column(String)
    sender = Column(String)
    recipient = Column(String)
    body = Column(Text)
    html_body = Column(Text)
    category = Column(String)  # lead, client, marketing, other
    status = Column(String, default="unread")  # unread, read, replied, archived
    is_outgoing = Column(Boolean, default=False)
    attachments = Column(JSON)  # JSON array of attachment URLs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("Client", backref="emails")
    
    def __repr__(self):
        return f"<Email {self.subject}>"

class Transcription(Base):
    __tablename__ = "transcriptions"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=True)
    title = Column(String)
    audio_url = Column(String)
    text = Column(Text)
    duration = Column(String)  # Duration of the audio in format "HH:MM:SS"
    status = Column(String, default="pending")  # pending, processing, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("Client", backref="transcriptions")
    offers = relationship("Offer", back_populates="transcription")
    
    def __repr__(self):
        return f"<Transcription {self.title}>"