from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.order import OrderType, OrderStatus, PaymentStatus, PaymentMethod

class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    product_sku: str
    sku: Optional[str] = None
    unit_price: Decimal
    price: Optional[Decimal] = None
    quantity: int
    total_price: Decimal
    image_url: Optional[str] = None
    product_image: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class OrderOut(BaseModel):
    id: int
    order_number: str
    user_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_type: OrderType
    status: OrderStatus
    subtotal: Decimal
    delivery_fee: Decimal
    tax: Decimal
    total_amount: Decimal
    delivery_address: Optional[str] = None
    pickup_time_slot: Optional[str] = None
    notes: Optional[str] = None
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)

class CheckoutRequest(BaseModel):
    order_type: OrderType = OrderType.HOME_DELIVERY
    delivery_address: Optional[str] = None
    pickup_time_slot: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.SIMULATED_CARD
    payment_details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
