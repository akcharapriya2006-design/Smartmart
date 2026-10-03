from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderOut, CheckoutRequest, OrderStatusUpdate
from app.services.order_service import order_service

router = APIRouter()

def format_order_out(order: Order) -> OrderOut:
    items_out = []
    for item in order.items:
        img = item.product.image_url if item.product else None
        items_out.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "product_sku": item.product_sku,
            "sku": item.product_sku,
            "unit_price": item.unit_price,
            "price": item.unit_price,
            "quantity": item.quantity,
            "total_price": item.total_price,
            "image_url": img,
            "product_image": img
        })

    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        customer_name=order.user.full_name if order.user else "Guest",
        customer_email=order.user.email if order.user else None,
        order_type=order.order_type,
        status=order.status,
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        tax=order.tax,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        pickup_time_slot=order.pickup_time_slot,
        notes=order.notes,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        payment_reference=order.payment_reference,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_out
    )

@router.post("/checkout", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout_cart(
    checkout_in: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Place supermarket order from current cart with simulated payment."""
    order = order_service.checkout(db, current_user, checkout_in)
    return format_order_out(order)

@router.get("/my-orders", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve all past orders placed by the current customer."""
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.user_id == current_user.id)
        .order_by(desc(Order.created_at))
        .all()
    )
    return [format_order_out(o) for o in orders]

@router.get("/my-orders/{order_id}", response_model=OrderOut)
def get_my_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve details and item breakdown of a specific customer order."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return format_order_out(order)

@router.get("/admin/all", response_model=List[OrderOut])
def get_all_orders_admin(
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    search: Optional[str] = Query(None, description="Search by order number or customer name"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """List all supermarket orders with optional status/search filters (Admin only)."""
    query = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .join(Order.user)
    )

    if status:
        query = query.filter(Order.status == status)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Order.order_number.ilike(search_fmt)) |
            (User.full_name.ilike(search_fmt)) |
            (User.email.ilike(search_fmt))
        )

    orders = query.order_by(desc(Order.created_at)).all()
    return [format_order_out(o) for o in orders]

@router.put("/admin/{order_id}/status", response_model=OrderOut)
def update_order_status_admin(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Update order fulfillment status (Admin only)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = status_update.status
    db.add(order)
    db.commit()
    db.refresh(order)
    return format_order_out(order)
