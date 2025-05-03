from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Boolean, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="draft")  # draft, sent, viewed, accepted, rejected, expired
    source = Column(String)  # manual, transcription, form
    transcription_id = Column(String, ForeignKey("transcriptions.id"), nullable=True)
    include_installation = Column(Boolean, default=True)
    include_warranty = Column(Boolean, default=True)
    notes = Column(Text)
    valid_until = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    sent_at = Column(DateTime(timezone=True))
    viewed_at = Column(DateTime(timezone=True))
    accepted_at = Column(DateTime(timezone=True))
    rejected_at = Column(DateTime(timezone=True))
    
    # Relationships
    client = relationship("Client", back_populates="offers")
    created_by = relationship("User", back_populates="offers")
    transcription = relationship("Transcription", back_populates="offers")
    packages = relationship("OfferPackage", back_populates="offer")
    
    def __repr__(self):
        return f"<Offer {self.title} for {self.client_id}>"

class OfferPackage(Base):
    __tablename__ = "offer_packages"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    offer_id = Column(String, ForeignKey("offers.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Basic", "Premium", "Ultimate"
    description = Column(Text)
    price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    components = Column(JSON)  # List of components included in this package
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    offer = relationship("Offer", back_populates="packages")
    
    def __repr__(self):
        return f"<OfferPackage {self.name} for {self.offer_id}>"