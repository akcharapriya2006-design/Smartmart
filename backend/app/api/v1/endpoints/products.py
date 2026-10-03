from typing import Optional, Any
from decimal import Decimal
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.api.deps import get_db, require_admin, get_current_user
from app.models.product import Product
from app.models.category import Category
from app.models.user import User, UserRole
from app.models.inventory import InventoryTransaction, TransactionType
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductListResponse

router = APIRouter()

def format_product_out(product: Product) -> ProductOut:
    is_low = product.stock_quantity <= product.low_stock_threshold
    cat_name = product.category.name if product.category else None
    
    prod_dict = {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "description": product.description,
        "category_id": product.category_id,
        "price": product.price,
        "cost_price": product.cost_price,
        "stock_quantity": product.stock_quantity,
        "low_stock_threshold": product.low_stock_threshold,
        "unit": product.unit,
        "image_url": product.image_url,
        "is_active": product.is_active,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "is_low_stock": is_low,
        "category_name": cat_name
    }
    return ProductOut(**prod_dict)

@router.get("/", response_model=ProductListResponse)
def get_products(
    search: Optional[str] = Query(None, description="Search term for product name, SKU or description"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    min_price: Optional[Decimal] = Query(None, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, description="Maximum price filter"),
    in_stock_only: bool = Query(False, description="Filter to show only products currently in stock"),
    low_stock_only: bool = Query(False, description="Filter to show low stock items (Admin alert)"),
    sort_by: str = Query("name_asc", description="Sort option: name_asc, price_asc, price_desc, newest"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(24, ge=1, le=100, description="Items per page"),
    include_inactive: bool = Query(False, description="Include deactivated products (admin)"),
    db: Session = Depends(get_db)
) -> Any:
    """Search, filter, and paginate supermarket products."""
    query = db.query(Product).join(Product.category)

    if not include_inactive:
        query = query.filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_fmt),
                Product.sku.ilike(search_fmt),
                Product.description.ilike(search_fmt)
            )
        )

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if in_stock_only:
        query = query.filter(Product.stock_quantity > 0)

    if low_stock_only:
        query = query.filter(Product.stock_quantity <= Product.low_stock_threshold)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(asc(Product.price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.price))
    elif sort_by == "newest":
        query = query.order_by(desc(Product.created_at))
    else:
        query = query.order_by(asc(Product.name))

    total = query.count()
    total_pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    products = query.offset(offset).limit(size).all()
    items = [format_product_out(p) for p in products]

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve full details of a specific product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return format_product_out(product)

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
) -> Any:
    """Create a new supermarket product with initial inventory tracking (Admin only)."""
    # Check if SKU already exists
    existing = db.query(Product).filter(Product.sku.ilike(product_in.sku.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A product with SKU '{product_in.sku}' already exists"
        )

    # Check category exists
    cat = db.query(Category).filter(Category.id == product_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected category does not exist")

    product = Product(
        name=product_in.name.strip(),
        sku=product_in.sku.strip().upper(),
        description=product_in.description.strip() if product_in.description else None,
        category_id=product_in.category_id,
        price=product_in.price,
        cost_price=product_in.cost_price,
        stock_quantity=product_in.stock_quantity,
        low_stock_threshold=product_in.low_stock_threshold,
        unit=product_in.unit.strip(),
        image_url=product_in.image_url.strip() if product_in.image_url else None,
        is_active=product_in.is_active
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Log initial inventory transaction if stock > 0
    if product.stock_quantity > 0:
        inv = InventoryTransaction(
            product_id=product.id,
            change_quantity=product.stock_quantity,
            transaction_type=TransactionType.PURCHASE_ORDER,
            reference_id="NEW-PROD-INIT",
            note="Initial product creation stock balance",
            created_by=admin.id
        )
        db.add(inv)
        db.commit()

    return format_product_out(product)

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
) -> Any:
    """Update product information, pricing, or thresholds (Admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product_in.sku is not None and product_in.sku.strip().upper() != product.sku:
        existing = db.query(Product).filter(Product.sku.ilike(product_in.sku.strip())).first()
        if existing and existing.id != product_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already in use by another product")
        product.sku = product_in.sku.strip().upper()

    if product_in.category_id is not None:
        cat = db.query(Category).filter(Category.id == product_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected category does not exist")
        product.category_id = product_in.category_id

    if product_in.name is not None:
        product.name = product_in.name.strip()
    if product_in.description is not None:
        product.description = product_in.description.strip()
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.cost_price is not None:
        product.cost_price = product_in.cost_price
    if product_in.stock_quantity is not None and product_in.stock_quantity != product.stock_quantity:
        diff = product_in.stock_quantity - product.stock_quantity
        product.stock_quantity = product_in.stock_quantity
        # Log manual adjustment transaction
        inv = InventoryTransaction(
            product_id=product.id,
            change_quantity=diff,
            transaction_type=TransactionType.MANUAL_ADJUSTMENT,
            reference_id="ADMIN-EDIT",
            note="Stock adjusted via product edit modal",
            created_by=admin.id
        )
        db.add(inv)
    if product_in.low_stock_threshold is not None:
        product.low_stock_threshold = product_in.low_stock_threshold
    if product_in.unit is not None:
        product.unit = product_in.unit.strip()
    if product_in.image_url is not None:
        product.image_url = product_in.image_url.strip()
    if product_in.is_active is not None:
        product.is_active = product_in.is_active

    db.add(product)
    db.commit()
    db.refresh(product)
    return format_product_out(product)

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin)
) -> Any:
    """Toggle product active/inactive status (Admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.is_active = not product.is_active
    db.add(product)
    db.commit()
    return {"message": f"Product '{product.name}' status updated to {'Active' if product.is_active else 'Inactive'}"}
