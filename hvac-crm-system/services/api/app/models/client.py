from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True, nullable=False)
    email = Column(String, index=True)
    phone = Column(String)
    address = Column(String)
    city = Column(String)
    district = Column(String, index=True)
    postal_code = Column(String)
    notes = Column(Text)
    source = Column(String)  # website, referral, google, facebook, other
    created_by_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Geolocation
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Relationships
    created_by = relationship("User", back_populates="clients")
    installations = relationship("Installation", back_populates="client")
    offers = relationship("Offer", back_populates="client")
    services = relationship("Service", back_populates="client")
    
    def __repr__(self):
        return f"<Client {self.name}>"

class Installation(Base):
    __tablename__ = "installations"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    equipment_type = Column(String, nullable=False)  # AC, heat pump, etc.
    model = Column(String)
    serial_number = Column(String)
    installation_date = Column(DateTime(timezone=True))
    warranty_expiry = Column(DateTime(timezone=True))
    location_description = Column(String)  # e.g., "Master Bedroom"
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Geolocation
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Relationships
    client = relationship("Client", back_populates="installations")
    services = relationship("Service", back_populates="installation")
    
    def __repr__(self):
        return f"<Installation {self.equipment_type} for {self.client_id}>"