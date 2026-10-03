from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.api.deps import get_db, require_admin
from app.models.user import User
from app.models.product import Product
from app.models.inventory import InventoryTransaction, TransactionType
from app.schemas.inventory import (
    RestockRequest,
    StockLevelOut,
    InventoryTransactionOut,
    LowStockAlertSummary
)

router = APIRouter()

def format_stock_out(product: Product) -> StockLevelOut:
    return StockLevelOut(
        product_id=product.id,
        name=product.name,
        sku=product.sku,
        category_name=product.category.name if product.category else "General",
        stock_quantity=product.stock_quantity,
        low_stock_threshold=product.low_stock_threshold,
        unit=product.unit,
        is_low_stock=product.stock_quantity <= product.low_stock_threshold,
        price=float(product.price)
    )

@router.get("/stock", response_model=List[StockLevelOut])
def get_inventory_stock(
    sort_by: str = Query("lowest_first", description="lowest_first or highest_first"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve full inventory list with current stock levels (Admin only)."""
    query = db.query(Product).filter(Product.is_active == True)

    if sort_by == "highest_first":
        query = query.order_by(desc(Product.stock_quantity))
    else:
        query = query.order_by(asc(Product.stock_quantity))

    products = query.all()
    return [format_stock_out(p) for p in products]

@router.post("/restock", response_model=StockLevelOut)
def restock_inventory(
    restock_in: RestockRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
) -> Any:
    """Restock inventory for a product and record an audit transaction (Admin only)."""
    product = db.query(Product).filter(Product.id == restock_in.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Add stock
    product.stock_quantity += restock_in.quantity
    db.add(product)

    # Record Inventory Transaction
    trans = InventoryTransaction(
        product_id=product.id,
        change_quantity=restock_in.quantity,
        transaction_type=TransactionType.PURCHASE_ORDER,
        reference_id=f"RESTOCK-{admin.id}",
        note=restock_in.note or "Shipment restocking",
        created_by=admin.id
    )
    db.add(trans)
    db.commit()
    db.refresh(product)

    return format_stock_out(product)

@router.get("/transactions", response_model=List[InventoryTransactionOut])
def get_inventory_transactions(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve audit history of all inventory movements: sales, restocks, adjustments (Admin only)."""
    transactions = db.query(InventoryTransaction).order_by(desc(InventoryTransaction.created_at)).limit(limit).all()

    out = []
    for t in transactions:
        prod = t.product
        out.append(
            InventoryTransactionOut(
                id=t.id,
                product_id=t.product_id,
                product_name=prod.name if prod else "Deleted Item",
                product_sku=prod.sku if prod else "N/A",
                change_quantity=t.change_quantity,
                transaction_type=t.transaction_type,
                reference_id=t.reference_id,
                note=t.note,
                created_at=t.created_at,
                created_by_name="Store Admin"
            )
        )
    return out

@router.get("/alerts", response_model=LowStockAlertSummary)
def get_low_stock_alerts(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve real-time alert summary of all items needing restocking (Admin only)."""
    low_stock_products = db.query(Product).filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.low_stock_threshold
    ).order_by(asc(Product.stock_quantity)).all()

    alerts = [format_stock_out(p) for p in low_stock_products]
    critical_out = sum(1 for p in low_stock_products if p.stock_quantity == 0)

    return LowStockAlertSummary(
        total_low_stock_count=len(alerts),
        critical_out_of_stock_count=critical_out,
        alerts=alerts
    )
