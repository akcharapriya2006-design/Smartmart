from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)

class CartItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal
    stock_available: int
    image_url: Optional[str] = None
    unit: str
    model_config = ConfigDict(from_attributes=True)

class CartSummaryOut(BaseModel):
    items: List[CartItemOut]
    subtotal: Decimal
    estimated_tax: Decimal
    delivery_fee: Decimal
    estimated_total: Decimal
    item_count: int
    free_delivery_threshold: Decimal = Decimal("40.00")
    amount_needed_for_free_delivery: Decimal = Decimal("0.00")
