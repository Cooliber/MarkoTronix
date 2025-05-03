from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    contact_name = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    website = Column(String)
    notes = Column(Text)
    rating = Column(Float)  # 1-5 rating
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    components = relationship("Component", back_populates="supplier")
    
    def __repr__(self):
        return f"<Supplier {self.name}>"

class Component(Base):
    __tablename__ = "components"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # AC unit, heat pump, thermostat, etc.
    model = Column(String)
    sku = Column(String)
    price = Column(Float)
    cost = Column(Float)
    quantity = Column(Integer, default=0)
    min_quantity = Column(Integer, default=1)
    image_url = Column(String)
    specs = Column(JSON)  # JSON object with technical specifications
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier", back_populates="components")
    
    def __repr__(self):
        return f"<Component {self.name}>"

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    order_number = Column(String)
    status = Column(String, default="pending")  # pending, ordered, shipped, delivered, cancelled
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    expected_delivery = Column(DateTime(timezone=True))
    actual_delivery = Column(DateTime(timezone=True))
    total_amount = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier")
    items = relationship("OrderItem", back_populates="order")
    
    def __repr__(self):
        return f"<Order {self.order_number}>"

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    component_id = Column(String, ForeignKey("components.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="items")
    component = relationship("Component")
    
    def __repr__(self):
        return f"<OrderItem {self.component_id} x{self.quantity}>"