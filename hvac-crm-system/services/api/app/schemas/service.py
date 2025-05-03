from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class ServiceBase(BaseModel):
    client_id: str
    installation_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    service_type: str
    scheduled_date: datetime
    scheduled_time_slot: Optional[str] = None
    estimated_duration: Optional[int] = None
    notes: Optional[str] = None
    priority: Optional[str] = "normal"

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    installation_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    service_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    scheduled_time_slot: Optional[str] = None
    estimated_duration: Optional[int] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class ServiceResponse(ServiceBase):
    id: str
    status: str
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ServiceReportBase(BaseModel):
    checklist: Optional[List[Dict[str, Any]]] = None
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    parts_used: Optional[List[Dict[str, Any]]] = None
    signature_url: Optional[str] = None
    photos: Optional[List[str]] = None

class ServiceReportCreate(ServiceReportBase):
    pass

class ServiceReportUpdate(BaseModel):
    checklist: Optional[List[Dict[str, Any]]] = None
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    parts_used: Optional[List[Dict[str, Any]]] = None
    signature_url: Optional[str] = None
    photos: Optional[List[str]] = None

class ServiceReportResponse(ServiceReportBase):
    id: str
    service_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ServiceWithReportResponse(ServiceResponse):
    reports: List[ServiceReportResponse] = []
    
    class Config:
        orm_mode = True