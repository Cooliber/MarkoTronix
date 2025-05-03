from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class OfferPackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    discount: Optional[float] = 0.0
    components: Optional[Dict[str, Any]] = None

class OfferPackageCreate(OfferPackageBase):
    pass

class OfferPackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    discount: Optional[float] = None
    components: Optional[Dict[str, Any]] = None

class OfferPackageResponse(OfferPackageBase):
    id: str
    offer_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class OfferBase(BaseModel):
    client_id: str
    title: str
    description: Optional[str] = None
    source: Optional[str] = None  # manual, transcription, form
    transcription_id: Optional[str] = None
    include_installation: Optional[bool] = True
    include_warranty: Optional[bool] = True
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

class OfferCreate(OfferBase):
    packages: Optional[List[OfferPackageCreate]] = None

class OfferUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    include_installation: Optional[bool] = None
    include_warranty: Optional[bool] = None
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

class OfferResponse(OfferBase):
    id: str
    created_by_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class OfferWithPackagesResponse(OfferResponse):
    packages: List[OfferPackageResponse] = []
    
    class Config:
        orm_mode = True