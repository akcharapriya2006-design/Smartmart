from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.cart import CartItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemOut, CartSummaryOut

router = APIRouter()

TAX_RATE = Decimal("0.08")
STANDARD_DELIVERY_FEE = Decimal("3.99")
FREE_DELIVERY_THRESHOLD = Decimal("40.00")

def calculate_cart_summary(db: Session, user: User) -> CartSummaryOut:
    cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()

    items_out = []
    subtotal = Decimal("0.00")
    total_qty = 0

    for item in cart_items:
        prod = item.product
        if not prod:
            continue

        item_total = (prod.price * item.quantity).quantize(Decimal("0.01"))
        subtotal += item_total
        total_qty += item.quantity

        items_out.append(
            CartItemOut(
                id=item.id,
                product_id=prod.id,
                product_name=prod.name,
                product_sku=prod.sku,
                unit_price=prod.price,
                quantity=item.quantity,
                total_price=item_total,
                stock_available=prod.stock_quantity,
                image_url=prod.image_url,
                unit=prod.unit
            )
        )

    delivery_fee = Decimal("0.00") if subtotal >= FREE_DELIVERY_THRESHOLD or subtotal == 0 else STANDARD_DELIVERY_FEE
    estimated_tax = (subtotal * TAX_RATE).quantize(Decimal("0.01"))
    estimated_total = (subtotal + delivery_fee + estimated_tax).quantize(Decimal("0.01"))

    amount_needed = max(Decimal("0.00"), FREE_DELIVERY_THRESHOLD - subtotal)

    return CartSummaryOut(
        items=items_out,
        subtotal=subtotal,
        estimated_tax=estimated_tax,
        delivery_fee=delivery_fee,
        estimated_total=estimated_total,
        item_count=total_qty,
        free_delivery_threshold=FREE_DELIVERY_THRESHOLD,
        amount_needed_for_free_delivery=amount_needed
    )

@router.get("/", response_model=CartSummaryOut)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve current user's supermarket shopping cart with subtotal and taxes."""
    return calculate_cart_summary(db, current_user)

@router.post("/items", response_model=CartSummaryOut)
def add_item_to_cart(
    item_in: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Add a product to cart or increment quantity."""
    product = db.query(Product).filter(Product.id == item_in.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or currently unavailable")

    existing_cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item_in.product_id
    ).first()

    requested_qty = item_in.quantity
    if existing_cart_item:
        requested_qty += existing_cart_item.quantity

    if product.stock_quantity < requested_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock_quantity} available in stock for '{product.name}'"
        )

    if existing_cart_item:
        existing_cart_item.quantity = requested_qty
        db.add(existing_cart_item)
    else:
        new_item = CartItem(
            user_id=current_user.id,
            product_id=product.id,
            quantity=item_in.quantity
        )
        db.add(new_item)

    db.commit()
    return calculate_cart_summary(db, current_user)

@router.put("/items/{item_id}", response_model=CartSummaryOut)
def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update cart item quantity."""
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    product = cart_item.product
    if product and product.stock_quantity < item_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock_quantity} units available in stock"
        )

    cart_item.quantity = item_in.quantity
    db.add(cart_item)
    db.commit()
    return calculate_cart_summary(db, current_user)

@router.delete("/items/{item_id}", response_model=CartSummaryOut)
def delete_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Remove a product from the shopping cart."""
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return calculate_cart_summary(db, current_user)

@router.delete("/", response_model=CartSummaryOut)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Clear all items in the shopping cart."""
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return calculate_cart_summary(db, current_user)
