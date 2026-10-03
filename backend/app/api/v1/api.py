from fastapi import APIRouter
from app.api.v1.endpoints import auth, categories, products, cart, orders, inventory, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(categories.router, prefix="/categories", tags=["Supermarket Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Supermarket Products"])
api_router.include_router(cart.router, prefix="/cart", tags=["Shopping Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Checkout"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory & Low-Stock Alerts"])
api_router.include_router(reports.router, prefix="/reports", tags=["Dashboard & Sales Analytics"])
