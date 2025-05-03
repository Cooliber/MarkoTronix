from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Boolean, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Service(Base):
    __tablename__ = "services"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    installation_id = Column(String, ForeignKey("installations.id"), nullable=True)
    assigned_to_id = Column(String, ForeignKey("users.id"), nullable=True)
    service_type = Column(String, nullable=False)  # inspection, installation, maintenance, repair, emergency
    status = Column(String, default="scheduled")  # scheduled, in_progress, completed, cancelled
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    scheduled_time_slot = Column(String)  # morning, afternoon, evening
    estimated_duration = Column(Integer)  # in minutes
    actual_start_time = Column(DateTime(timezone=True))
    actual_end_time = Column(DateTime(timezone=True))
    notes = Column(Text)
    priority = Column(String, default="normal")  # low, normal, high
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("Client", back_populates="services")
    installation = relationship("Installation", back_populates="services")
    assigned_to = relationship("User", back_populates="services")
    reports = relationship("ServiceReport", back_populates="service")
    
    def __repr__(self):
        return f"<Service {self.service_type} for {self.client_id}>"

class ServiceReport(Base):
    __tablename__ = "service_reports"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    service_id = Column(String, ForeignKey("services.id"), nullable=False)
    checklist = Column(JSON)  # JSON array of completed checklist items
    findings = Column(Text)
    recommendations = Column(Text)
    parts_used = Column(JSON)  # JSON array of parts used
    signature_url = Column(String)  # URL to client signature image
    photos = Column(JSON)  # JSON array of photo URLs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    service = relationship("Service", back_populates="reports")
    
    def __repr__(self):
        return f"<ServiceReport for {self.service_id}>"