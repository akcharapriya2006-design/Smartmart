import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_01_health_check():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_02_auth_admin_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@smartmart.com",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_03_customer_registration_and_login():
    email = "intern.tester@smartmart.com"
    # Register
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "secretpassword123",
        "full_name": "Intern Tester",
        "phone": "+1 555-0199",
        "default_address": "742 Evergreen Terrace"
    })
    # If already registered from previous run, status is 400 or 201
    assert res.status_code in (201, 400)

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "secretpassword123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert bool(token) is True

    # Check /me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Intern Tester"

def test_04_categories_catalog():
    res = client.get("/api/v1/categories/")
    assert res.status_code == 200
    cats = res.json()
    assert len(cats) >= 7
    # Verify product_count is populated
    assert any(c["product_count"] > 0 for c in cats)

def test_05_products_search_and_filters():
    # 1. Total products
    res = client.get("/api/v1/products/")
    assert res.status_code == 200
    total = res.json()["total"]
    assert total >= 20

    # 2. Search keyword
    search_res = client.get("/api/v1/products/?search=banana")
    assert search_res.status_code == 200
    assert any("banana" in p["name"].lower() for p in search_res.json()["items"])

    # 3. Low stock filter
    low_res = client.get("/api/v1/products/?low_stock_only=true")
    assert low_res.status_code == 200
    for p in low_res.json()["items"]:
        assert p["stock_quantity"] <= p["low_stock_threshold"]

def test_06_customer_cart_and_checkout_flow():
    # Login customer
    login = client.post("/api/v1/auth/login", json={
        "email": "customer@smartmart.com",
        "password": "customer123"
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Clear cart first
    client.delete("/api/v1/cart/", headers=headers)

    # Add item 1
    add_res = client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 2}, headers=headers)
    assert add_res.status_code == 200
    assert add_res.json()["item_count"] == 2

    # Update item quantity
    item_id = add_res.json()["items"][0]["id"]
    upd_res = client.put(f"/api/v1/cart/items/{item_id}", json={"quantity": 3}, headers=headers)
    assert upd_res.status_code == 200
    assert upd_res.json()["item_count"] == 3

    # Checkout with simulated card
    checkout_res = client.post("/api/v1/orders/checkout", json={
        "order_type": "HOME_DELIVERY",
        "delivery_address": "42 Elm Street, Springfield",
        "payment_method": "SIMULATED_CARD",
        "payment_details": {"card_number": "4111222233334444"}
    }, headers=headers)
    assert checkout_res.status_code == 201
    order = checkout_res.json()
    assert order["order_number"].startswith("SM-2026-")
    assert order["status"] == "CONFIRMED"
    assert order["payment_status"] == "PAID"

    # Verify cart is empty
    cart_res = client.get("/api/v1/cart/", headers=headers)
    assert cart_res.json()["item_count"] == 0

    # Verify order appears in customer order history
    my_orders = client.get("/api/v1/orders/my-orders", headers=headers)
    assert my_orders.status_code == 200
    assert any(o["order_number"] == order["order_number"] for o in my_orders.json())

def test_07_admin_operations():
    # Login admin
    login = client.post("/api/v1/auth/login", json={
        "email": "admin@smartmart.com",
        "password": "admin123"
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Dashboard summary
    summary = client.get("/api/v1/reports/dashboard-summary", headers=headers)
    assert summary.status_code == 200
    assert summary.json()["total_orders"] >= 1
    assert float(summary.json()["total_revenue"]) > 0

    # 2. Sales trend
    trend = client.get("/api/v1/reports/sales-trend?days=7", headers=headers)
    assert trend.status_code == 200
    assert len(trend.json()) == 7

    # 3. Category shares
    shares = client.get("/api/v1/reports/category-shares", headers=headers)
    assert shares.status_code == 200
    assert len(shares.json()) >= 7

    # 4. Restock an item
    restock = client.post("/api/v1/inventory/restock", json={
        "product_id": 1,
        "quantity": 25,
        "note": "Automated E2E restocking test batch"
    }, headers=headers)
    assert restock.status_code == 200
    assert restock.json()["stock_quantity"] >= 25

    # 5. Inventory transaction audit log
    txns = client.get("/api/v1/inventory/transactions?limit=10", headers=headers)
    assert txns.status_code == 200
    assert len(txns.json()) >= 1
    assert any("restocking" in (t["note"] or "").lower() for t in txns.json())

    # 6. Admin order status update
    all_orders = client.get("/api/v1/orders/admin/all", headers=headers)
    assert all_orders.status_code == 200
    assert len(all_orders.json()) >= 1
    first_order_id = all_orders.json()[0]["id"]

    stat_res = client.put(f"/api/v1/orders/admin/{first_order_id}/status", json={
        "status": "PROCESSING"
    }, headers=headers)
    assert stat_res.status_code == 200
    assert stat_res.json()["status"] == "PROCESSING"

    # 7. Customer list and account status toggle
    custs = client.get("/api/v1/reports/customers", headers=headers)
    assert custs.status_code == 200
    assert len(custs.json()) >= 1
    target_cust = custs.json()[0]
    assert "is_active" in target_cust
    target_id = target_cust["user_id"]

    # 8. Admin deactivate customer account
    deact_res = client.put(f"/api/v1/reports/customers/{target_id}/status", json={"is_active": False}, headers=headers)
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    # 9. Admin reactivate customer account
    react_res = client.put(f"/api/v1/reports/customers/{target_id}/status", json={"is_active": True}, headers=headers)
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True

def test_08_admin_authorization_enforced():
    # Customer login
    login = client.post("/api/v1/auth/login", json={
        "email": "customer@smartmart.com",
        "password": "customer123"
    })
    cust_token = login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Verify customer receives 403 Forbidden on all admin endpoints
    assert client.get("/api/v1/reports/dashboard-summary", headers=cust_headers).status_code == 403
    assert client.get("/api/v1/reports/customers", headers=cust_headers).status_code == 403
    assert client.get("/api/v1/inventory/stock", headers=cust_headers).status_code == 403
    assert client.get("/api/v1/orders/admin/all", headers=cust_headers).status_code == 403
    assert client.post("/api/v1/products/", json={
        "name": "Hacked Product",
        "sku": "HACK-999",
        "category_id": 1,
        "price": 10.0,
        "unit": "pcs",
        "stock_quantity": 10
    }, headers=cust_headers).status_code == 403


def test_live_order_status_tracking_flow():
    """
    Test the live order status tracking flow:
    1. Customer places order (CONFIRMED)
    2. Admin sees order
    3. Admin changes: Confirmed -> Preparing
    4. Customer fetches order status (PREPARING)
    5. Admin changes: Preparing -> Out for Delivery
    6. Customer fetches order status (OUT_FOR_DELIVERY)
    7. Admin changes: Out for Delivery -> Delivered
    8. Customer fetches order status (DELIVERED)
    9. Admin can also set status to CANCELLED
    """
    # Login Admin
    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@smartmart.com", "password": "admin123"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Login Customer
    cust_login = client.post("/api/v1/auth/login", json={"email": "customer@smartmart.com", "password": "customer123"})
    assert cust_login.status_code == 200
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Add item to cart and checkout
    prods = client.get("/api/v1/products/").json()["items"]
    assert len(prods) > 0
    p = prods[0]

    client.post("/api/v1/cart/items", json={"product_id": p["id"], "quantity": 1}, headers=cust_headers)

    checkout_res = client.post("/api/v1/orders/checkout", json={
        "order_type": "HOME_DELIVERY",
        "delivery_address": "456 Greenfield Ave, Apt 3B, New York, NY",
        "payment_method": "SIMULATED_CARD",
        "payment_details": {"card_number": "4111222233334444", "cvv": "123", "expiry": "12/28"}
    }, headers=cust_headers)
    assert checkout_res.status_code == 201
    order_id = checkout_res.json()["id"]
    assert checkout_res.json()["status"] == "CONFIRMED"

    # Step 2: Admin sees order
    admin_orders = client.get("/api/v1/orders/admin/all", headers=admin_headers)
    assert admin_orders.status_code == 200
    matched = [o for o in admin_orders.json() if o["id"] == order_id]
    assert len(matched) == 1
    assert matched[0]["status"] == "CONFIRMED"

    # Step 3: Admin changes: Confirmed -> Preparing
    res_prep = client.put(f"/api/v1/orders/admin/{order_id}/status", json={"status": "PREPARING"}, headers=admin_headers)
    assert res_prep.status_code == 200
    assert res_prep.json()["status"] == "PREPARING"

    # Step 4: Customer sees Preparing
    cust_order = client.get(f"/api/v1/orders/my-orders/{order_id}", headers=cust_headers)
    assert cust_order.status_code == 200
    assert cust_order.json()["status"] == "PREPARING"

    # Step 5: Admin changes: Preparing -> Out for Delivery
    res_out = client.put(f"/api/v1/orders/admin/{order_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=admin_headers)
    assert res_out.status_code == 200
    assert res_out.json()["status"] == "OUT_FOR_DELIVERY"

    # Step 6: Customer sees Out for Delivery
    cust_order2 = client.get(f"/api/v1/orders/my-orders/{order_id}", headers=cust_headers)
    assert cust_order2.status_code == 200
    assert cust_order2.json()["status"] == "OUT_FOR_DELIVERY"

    # Step 7: Admin changes: Out for Delivery -> Delivered
    res_deliv = client.put(f"/api/v1/orders/admin/{order_id}/status", json={"status": "DELIVERED"}, headers=admin_headers)
    assert res_deliv.status_code == 200
    assert res_deliv.json()["status"] == "DELIVERED"

    # Step 8: Customer sees Delivered
    cust_order3 = client.get(f"/api/v1/orders/my-orders/{order_id}", headers=cust_headers)
    assert cust_order3.status_code == 200
    assert cust_order3.json()["status"] == "DELIVERED"

    # Step 9: Admin can also set status to CANCELLED
    res_cancel = client.put(f"/api/v1/orders/admin/{order_id}/status", json={"status": "CANCELLED"}, headers=admin_headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "CANCELLED"

    cust_order4 = client.get(f"/api/v1/orders/my-orders/{order_id}", headers=cust_headers)
    assert cust_order4.status_code == 200
    assert cust_order4.json()["status"] == "CANCELLED"

