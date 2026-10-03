from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.api.deps import get_db, require_admin
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.category import Category
from app.schemas.report import (
    DashboardSummaryOut,
    SalesTrendPoint,
    CategorySharePoint,
    TopProductOut,
    CustomerSummaryOut,
    CustomerStatusUpdate
)

router = APIRouter()

@router.get("/dashboard-summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve top-level KPI metrics for the Admin Dashboard."""
    # Total Revenue (sum of completed/confirmed orders)
    rev_res = db.query(func.sum(Order.total_amount)).filter(Order.status != OrderStatus.CANCELLED).scalar()
    total_revenue = Decimal(str(rev_res or "0.00")).quantize(Decimal("0.01"))

    # Total Orders
    total_orders = db.query(Order).count()

    # Total Registered Customers
    total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()

    # Total Active Products
    total_products = db.query(Product).filter(Product.is_active == True).count()

    # Low Stock Items Count
    low_stock_count = db.query(Product).filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.low_stock_threshold
    ).count()

    # Pending Orders Count
    pending_orders = db.query(Order).filter(
        Order.status.in_([
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.PROCESSING,
            OrderStatus.OUT_FOR_DELIVERY
        ])
    ).count()

    # Today's Sales
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_sales_res = db.query(func.sum(Order.total_amount)).filter(
        Order.created_at >= today_start,
        Order.status != OrderStatus.CANCELLED
    ).scalar()
    today_sales = Decimal(str(today_sales_res or "0.00")).quantize(Decimal("0.01"))

    return DashboardSummaryOut(
        total_revenue=total_revenue,
        total_orders=total_orders,
        total_customers=total_customers,
        total_products=total_products,
        low_stock_count=low_stock_count,
        pending_orders_count=pending_orders,
        recent_sales_today=today_sales
    )

@router.get("/sales-trend", response_model=List[SalesTrendPoint])
def get_sales_trend(
    days: int = Query(7, ge=3, le=30),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve daily sales revenue and volume for Chart.js Line chart."""
    end_date = datetime.now(timezone.utc)
    points = []

    for i in range(days - 1, -1, -1):
        target_day = end_date - timedelta(days=i)
        day_start = target_day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = target_day.replace(hour=23, minute=59, second=59, microsecond=999999)

        day_orders = db.query(Order).filter(
            Order.created_at >= day_start,
            Order.created_at <= day_end,
            Order.status != OrderStatus.CANCELLED
        ).all()

        day_rev = sum([Decimal(str(o.total_amount)) for o in day_orders], Decimal("0.00"))
        points.append(
            SalesTrendPoint(
                date=target_day.strftime("%b %d"),
                revenue=day_rev.quantize(Decimal("0.01")),
                order_count=len(day_orders)
            )
        )

    return points

@router.get("/category-shares", response_model=List[CategorySharePoint])
def get_category_shares(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve category revenue distribution for Chart.js Doughnut chart."""
    categories = db.query(Category).all()
    results = []
    total_all_rev = Decimal("0.00")

    for cat in categories:
        # Sum order items belonging to products of this category
        items = db.query(OrderItem).join(Product, Product.id == OrderItem.product_id).filter(
            Product.category_id == cat.id
        ).all()

        cat_rev = sum([Decimal(str(it.total_price)) for it in items], Decimal("0.00"))
        cat_units = sum([it.quantity for it in items], 0)
        total_all_rev += cat_rev

        results.append({
            "category_name": cat.name,
            "revenue": cat_rev.quantize(Decimal("0.01")),
            "units_sold": cat_units
        })

    # If no sales recorded yet, return category catalog product distribution
    if total_all_rev == 0:
        total_prods = sum(len(c.products) for c in categories) or 1
        return [
            CategorySharePoint(
                category_name=c.name,
                revenue=Decimal("0.00"),
                units_sold=0,
                percentage=round((len(c.products) / total_prods) * 100, 1)
            )
            for c in categories
        ]

    out = []
    for r in results:
        pct = round(float((r["revenue"] / total_all_rev) * 100), 1) if total_all_rev > 0 else 0.0
        out.append(
            CategorySharePoint(
                category_name=r["category_name"],
                revenue=r["revenue"],
                units_sold=r["units_sold"],
                percentage=pct
            )
        )
    return out

@router.get("/top-products", response_model=List[TopProductOut])
def get_top_products(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve top selling supermarket products."""
    products = db.query(Product).all()
    prod_metrics = []

    for p in products:
        items = db.query(OrderItem).filter(OrderItem.product_id == p.id).all()
        units = sum([it.quantity for it in items], 0)
        rev = sum([Decimal(str(it.total_price)) for it in items], Decimal("0.00"))
        prod_metrics.append({
            "product_id": p.id,
            "product_name": p.name,
            "product_sku": p.sku,
            "category_name": p.category.name if p.category else "General",
            "units_sold": units,
            "total_revenue": rev.quantize(Decimal("0.01"))
        })

    # Sort by units sold desc
    prod_metrics.sort(key=lambda x: (x["units_sold"], x["total_revenue"]), reverse=True)
    return [TopProductOut(**m) for m in prod_metrics[:limit]]

@router.get("/customers", response_model=List[CustomerSummaryOut])
def get_customer_management(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Retrieve registered customer list with order count and lifetime spend (Admin only)."""
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER).order_by(desc(User.created_at)).all()

    out = []
    for c in customers:
        orders = db.query(Order).filter(Order.user_id == c.id, Order.status != OrderStatus.CANCELLED).all()
        spent = sum([Decimal(str(o.total_amount)) for o in orders], Decimal("0.00"))
        out.append(
            CustomerSummaryOut(
                user_id=c.id,
                full_name=c.full_name,
                email=c.email,
                phone=c.phone,
                default_address=c.default_address,
                orders_count=len(orders),
                total_spent=spent.quantize(Decimal("0.01")),
                is_active=c.is_active,
                joined_at=c.created_at.strftime("%b %d, %Y")
            )
        )
    return out

@router.put("/customers/{user_id}/status", response_model=CustomerSummaryOut)
def update_customer_status(
    user_id: int,
    status_in: CustomerStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
) -> Any:
    """Activate or deactivate customer account status (Admin only)."""
    customer = db.query(User).filter(User.id == user_id, User.role == UserRole.CUSTOMER).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    customer.is_active = status_in.is_active
    db.add(customer)
    db.commit()
    db.refresh(customer)

    orders = db.query(Order).filter(Order.user_id == customer.id, Order.status != OrderStatus.CANCELLED).all()
    spent = sum([Decimal(str(o.total_amount)) for o in orders], Decimal("0.00"))
    return CustomerSummaryOut(
        user_id=customer.id,
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone,
        default_address=customer.default_address,
        orders_count=len(orders),
        total_spent=spent.quantize(Decimal("0.01")),
        is_active=customer.is_active,
        joined_at=customer.created_at.strftime("%b %d, %Y")
    )

