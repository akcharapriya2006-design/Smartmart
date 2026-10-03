import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

class TransactionType(str, enum.Enum):
    PURCHASE_ORDER = "PURCHASE_ORDER"       # Restocking inventory
    SALE = "SALE"                           # Order placed
    RETURN = "RETURN"                       # Customer return
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT" # Stock count sync / discrepancy correction
    DAMAGE = "DAMAGE"                       # Spoiled or broken inventory

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    change_quantity = Column(Integer, nullable=False) # Positive for additions, negative for deductions
    transaction_type = Column(Enum(TransactionType), nullable=False)
    reference_id = Column(String(100), nullable=True) # e.g. Order number or Restock batch
    note = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    product = relationship("Product", back_populates="inventory_transactions")
