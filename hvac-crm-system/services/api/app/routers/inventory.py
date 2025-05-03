from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.inventory import Supplier, Component, Order, OrderItem
from app.schemas.inventory import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
    ComponentCreate,
    ComponentResponse,
    ComponentUpdate,
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    OrderItemCreate,
    OrderItemResponse,
    OrderWithItemsResponse,
)

router = APIRouter()

# Supplier endpoints

@router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new supplier.
    """
    supplier = Supplier(**supplier_in.dict(exclude_unset=True))
    
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    
    return supplier

@router.get("/suppliers", response_model=List[SupplierResponse])
async def read_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve suppliers.
    """
    suppliers = db.query(Supplier).offset(skip).limit(limit).all()
    
    return suppliers

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def read_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific supplier by ID.
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    
    return supplier

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: str,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a supplier.
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    
    update_data = supplier_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    db.commit()
    db.refresh(supplier)
    
    return supplier

@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a supplier.
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    
    db.delete(supplier)
    db.commit()
    
    return None

# Component endpoints

@router.post("/components", response_model=ComponentResponse)
async def create_component(
    component_in: ComponentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new component.
    """
    component = Component(**component_in.dict(exclude_unset=True))
    
    db.add(component)
    db.commit()
    db.refresh(component)
    
    return component

@router.get("/components", response_model=List[ComponentResponse])
async def read_components(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    supplier_id: Optional[str] = None,
    search: Optional[str] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve components with optional filtering.
    """
    query = db.query(Component)
    
    if category:
        query = query.filter(Component.category == category)
    
    if supplier_id:
        query = query.filter(Component.supplier_id == supplier_id)
    
    if search:
        query = query.filter(
            Component.name.ilike(f"%{search}%") |
            Component.description.ilike(f"%{search}%") |
            Component.model.ilike(f"%{search}%") |
            Component.sku.ilike(f"%{search}%")
        )
    
    if low_stock:
        query = query.filter(Component.quantity <= Component.min_quantity)
    
    components = query.offset(skip).limit(limit).all()
    
    return components

@router.get("/components/{component_id}", response_model=ComponentResponse)
async def read_component(
    component_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific component by ID.
    """
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found",
        )
    
    return component

@router.put("/components/{component_id}", response_model=ComponentResponse)
async def update_component(
    component_id: str,
    component_in: ComponentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a component.
    """
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found",
        )
    
    update_data = component_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(component, field, value)
    
    db.commit()
    db.refresh(component)
    
    return component

@router.delete("/components/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_component(
    component_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a component.
    """
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found",
        )
    
    db.delete(component)
    db.commit()
    
    return None

# Order endpoints

@router.post("/orders", response_model=OrderResponse)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new order.
    """
    order = Order(
        **order_in.dict(exclude_unset=True, exclude={"items"}),
        status="pending",
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Add order items if provided
    if hasattr(order_in, "items") and order_in.items:
        for item_data in order_in.items:
            item = OrderItem(
                **item_data.dict(),
                order_id=order.id,
            )
            db.add(item)
        
        db.commit()
    
    return order

@router.get("/orders", response_model=List[OrderResponse])
async def read_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve orders with optional filtering.
    """
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status)
    
    if supplier_id:
        query = query.filter(Order.supplier_id == supplier_id)
    
    orders = query.order_by(Order.order_date.desc()).offset(skip).limit(limit).all()
    
    return orders

@router.get("/orders/{order_id}", response_model=OrderWithItemsResponse)
async def read_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific order by ID, including its items.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    return order

@router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    update_data = order_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)
    
    return order

@router.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    db.delete(order)
    db.commit()
    
    return None

@router.post("/orders/{order_id}/items", response_model=OrderItemResponse)
async def create_order_item(
    order_id: str,
    item_in: OrderItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add an item to an order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    item = OrderItem(
        **item_in.dict(),
        order_id=order_id,
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item

@router.get("/orders/{order_id}/items", response_model=List[OrderItemResponse])
async def read_order_items(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all items for an order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    return items

@router.delete("/orders/{order_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order_item(
    order_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove an item from an order.
    """
    item = db.query(OrderItem).filter(
        OrderItem.id == item_id,
        OrderItem.order_id == order_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found",
        )
    
    db.delete(item)
    db.commit()
    
    return None

@router.post("/orders/{order_id}/place", response_model=OrderResponse)
async def place_order(
    order_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Place an order with the supplier.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already in {order.status} status",
        )
    
    # Check if order has items
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has no items",
        )
    
    # Update order status
    order.status = "ordered"
    db.commit()
    db.refresh(order)
    
    # Add background task to send order to supplier
    from app.utils.inventory import send_order_to_supplier
    background_tasks.add_task(
        send_order_to_supplier,
        order_id=order.id,
    )
    
    return order

@router.post("/orders/{order_id}/receive", response_model=OrderResponse)
async def receive_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark an order as received and update inventory.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    if order.status not in ["ordered", "shipped"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is in {order.status} status and cannot be received",
        )
    
    # Update order status
    order.status = "delivered"
    order.actual_delivery = datetime.now()
    
    # Update inventory quantities
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    for item in items:
        component = db.query(Component).filter(Component.id == item.component_id).first()
        if component:
            component.quantity += item.quantity
    
    db.commit()
    db.refresh(order)
    
    return order