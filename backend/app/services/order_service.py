import uuid
from decimal import Decimal
from typing import Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.cart import CartItem
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderType, OrderStatus, PaymentStatus, PaymentMethod
from app.models.inventory import InventoryTransaction, TransactionType
from app.schemas.order import CheckoutRequest
from app.services.payment_service import payment_service

TAX_RATE = Decimal("0.08")  # 8% supermarket sales tax
STANDARD_DELIVERY_FEE = Decimal("3.99")
FREE_DELIVERY_THRESHOLD = Decimal("40.00")

class OrderService:
    @staticmethod
    def checkout(db: Session, user: User, checkout_req: CheckoutRequest) -> Order:
        """
        Execute atomic checkout transaction:
        1. Verify cart items exist
        2. Verify stock availability for every product
        3. Calculate financials (subtotal, delivery fee, tax, total)
        4. Decrement product inventory
        5. Log inventory sale transactions
        6. Process simulated payment
        7. Create Order & OrderItems
        8. Clear user cart
        """
        cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your shopping cart is empty. Add products before checking out."
            )

        # Validate Delivery Mode requirements
        if checkout_req.order_type == OrderType.HOME_DELIVERY:
            addr = checkout_req.delivery_address or user.default_address
            if not addr or not addr.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Delivery address is required for Home Delivery."
                )
            delivery_address = addr.strip()
            pickup_slot = None
        else:
            if not checkout_req.pickup_time_slot or not checkout_req.pickup_time_slot.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please select a store pickup time slot."
                )
            pickup_slot = checkout_req.pickup_time_slot.strip()
            delivery_address = "SmartMart Express Store Pickup"

        # Verify stock & lock products
        subtotal = Decimal("0.00")
        items_to_process = []

        for item in cart_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product or not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{item.product.name if item.product else 'Item'}' is currently unavailable."
                )
            
            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, requested: {item.quantity}."
                )

            item_total = (product.price * item.quantity).quantize(Decimal("0.01"))
            subtotal += item_total
            items_to_process.append((product, item.quantity, item_total))

        # Financial Calculations
        if checkout_req.order_type == OrderType.STORE_PICKUP:
            delivery_fee = Decimal("0.00")
        elif subtotal >= FREE_DELIVERY_THRESHOLD:
            delivery_fee = Decimal("0.00")
        else:
            delivery_fee = STANDARD_DELIVERY_FEE

        tax = (subtotal * TAX_RATE).quantize(Decimal("0.01"))
        total_amount = (subtotal + delivery_fee + tax).quantize(Decimal("0.01"))

        # Process Simulated Payment
        payment_status, payment_ref = payment_service.process_simulated_payment(
            payment_method=checkout_req.payment_method,
            amount=float(total_amount),
            details=checkout_req.payment_details
        )

        if payment_status == PaymentStatus.FAILED:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Simulated payment was declined. Please verify payment details or choose another method."
            )

        # Generate unique supermarket order number (e.g. SM-2026-X8F9A1)
        order_number = f"SM-2026-{uuid.uuid4().hex[:6].upper()}"

        # Create Order
        initial_order_status = OrderStatus.CONFIRMED if payment_status == PaymentStatus.PAID else OrderStatus.PENDING

        order = Order(
            order_number=order_number,
            user_id=user.id,
            order_type=checkout_req.order_type,
            status=initial_order_status,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            tax=tax,
            total_amount=total_amount,
            delivery_address=delivery_address,
            pickup_time_slot=pickup_slot,
            notes=checkout_req.notes.strip() if checkout_req.notes else None,
            payment_status=payment_status,
            payment_method=checkout_req.payment_method,
            payment_reference=payment_ref
        )
        db.add(order)
        db.flush()  # Flush to get order.id

        # Create OrderItems and Decrement Product Stock
        for prod, qty, item_tot in items_to_process:
            order_item = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                product_name=prod.name,
                product_sku=prod.sku,
                unit_price=prod.price,
                quantity=qty,
                total_price=item_tot
            )
            db.add(order_item)

            # Deduct stock
            prod.stock_quantity -= qty
            db.add(prod)

            # Record Inventory Audit Log
            inv_trans = InventoryTransaction(
                product_id=prod.id,
                change_quantity=-qty,
                transaction_type=TransactionType.SALE,
                reference_id=order.order_number,
                note=f"Supermarket order checkout {order.order_number}",
                created_by=user.id
            )
            db.add(inv_trans)

        # Clear User Cart
        db.query(CartItem).filter(CartItem.user_id == user.id).delete()

        # Commit entire atomic transaction
        db.commit()
        db.refresh(order)
        return order

order_service = OrderService()
