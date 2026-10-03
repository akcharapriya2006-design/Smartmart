from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel

class DashboardSummaryOut(BaseModel):
    total_revenue: Decimal
    total_orders: int
    total_customers: int
    total_products: int
    low_stock_count: int
    pending_orders_count: int
    recent_sales_today: Decimal

class SalesTrendPoint(BaseModel):
    date: str
    revenue: Decimal
    order_count: int

class CategorySharePoint(BaseModel):
    category_name: str
    revenue: Decimal
    units_sold: int
    percentage: float

class TopProductOut(BaseModel):
    product_id: int
    product_name: str
    product_sku: str
    category_name: str
    units_sold: int
    total_revenue: Decimal

class CustomerStatusUpdate(BaseModel):
    is_active: bool

class CustomerSummaryOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    default_address: Optional[str] = None
    orders_count: int
    total_spent: Decimal
    is_active: bool = True
    joined_at: str
