from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.inventory import TransactionType

class RestockRequest(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity to add to inventory")
    note: Optional[str] = "Restocking shipment received"

class StockLevelOut(BaseModel):
    product_id: int
    name: str
    sku: str
    category_name: Optional[str] = None
    stock_quantity: int
    low_stock_threshold: int
    unit: str
    is_low_stock: bool
    price: float
    model_config = ConfigDict(from_attributes=True)

class InventoryTransactionOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    change_quantity: int
    transaction_type: TransactionType
    reference_id: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime
    created_by_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class LowStockAlertSummary(BaseModel):
    total_low_stock_count: int
    critical_out_of_stock_count: int
    alerts: List[StockLevelOut]
