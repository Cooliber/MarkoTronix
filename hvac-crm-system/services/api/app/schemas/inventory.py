from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[float] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[float] = None

class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ComponentBase(BaseModel):
    supplier_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    model: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    quantity: Optional[int] = 0
    min_quantity: Optional[int] = 1
    image_url: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None

class ComponentCreate(ComponentBase):
    pass

class ComponentUpdate(BaseModel):
    supplier_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    model: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None
    image_url: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None

class ComponentResponse(ComponentBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class OrderItemBase(BaseModel):
    component_id: str
    quantity: int
    unit_price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: str
    order_id: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    supplier_id: Optional[str] = None
    order_number: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    total_amount: Optional[float] = None
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: Optional[List[OrderItemCreate]] = None

class OrderUpdate(BaseModel):
    supplier_id: Optional[str] = None
    order_number: Optional[str] = None
    status: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    total_amount: Optional[float] = None
    notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: str
    status: str
    order_date: datetime
    actual_delivery: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class OrderWithItemsResponse(OrderResponse):
    items: List[OrderItemResponse] = []
    
    class Config:
        orm_mode = True