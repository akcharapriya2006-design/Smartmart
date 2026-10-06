import logging
from decimal import Decimal
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.config import settings
from app.models import (
    User, UserRole,
    Category, Product,
    InventoryTransaction, TransactionType
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartmart.seeder")

CATEGORIES_DATA = [
    {
        "name": "Fresh Produce",
        "description": "Farm-fresh fruits, leafy greens, and crisp organic vegetables.",
        "image_url": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Dairy & Eggs",
        "description": "Pure farm milk, rich butter, artisanal cheeses, and free-range farm eggs.",
        "image_url": "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Bakery",
        "description": "Daily freshly baked bread, buttery croissants, bagels, and artisan cakes.",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Beverages",
        "description": "Fresh squeezed juices, sparkling sodas, roast coffee, and fine teas.",
        "image_url": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Pantry & Groceries",
        "description": "Basmati rice, whole wheat pasta, cold-pressed oils, sauces, and spices.",
        "image_url": "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Snacks & Confectionery",
        "description": "Crunchy roasted nuts, organic potato chips, dark chocolates, and cookies.",
        "image_url": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Household & Care",
        "description": "Eco-friendly detergents, kitchen paper rolls, surface cleaners, and essentials.",
        "image_url": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80"
    }
]

PRODUCTS_DATA = [
    # Fresh Produce
    {
        "category_name": "Fresh Produce",
        "name": "Organic Honeycrisp Apples",
        "sku": "PRD-APP-001",
        "description": "Sweet, crisp, and freshly hand-picked organic apples.",
        "price": Decimal("3.49"),
        "cost_price": Decimal("2.10"),
        "stock_quantity": 45,
        "low_stock_threshold": 15,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Fresh Produce",
        "name": "Organic Cavendish Bananas",
        "sku": "PRD-BAN-002",
        "description": "Naturally ripened yellow bananas packed with potassium.",
        "price": Decimal("1.29"),
        "cost_price": Decimal("0.70"),
        "stock_quantity": 80,
        "low_stock_threshold": 20,
        "unit": "bunch",
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Fresh Produce",
        "name": "Baby Spinach Leaves",
        "sku": "PRD-SPN-003",
        "description": "Washed and ready-to-eat tender baby spinach leaves.",
        "price": Decimal("2.99"),
        "cost_price": Decimal("1.50"),
        "stock_quantity": 8,  # Low stock intentionally for alerts
        "low_stock_threshold": 12,
        "unit": "pack",
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Fresh Produce",
        "name": "Vine-Ripened Roma Tomatoes",
        "sku": "PRD-TOM-004",
        "description": "Juicy and vibrant red tomatoes ideal for salads, cooking, and sauces.",
        "price": Decimal("2.49"),
        "cost_price": Decimal("1.30"),
        "stock_quantity": 35,
        "low_stock_threshold": 10,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80"
    },

    # Dairy & Eggs
    {
        "category_name": "Dairy & Eggs",
        "name": "Farm Fresh Whole Milk (3.8% Fat)",
        "sku": "DRY-MLK-001",
        "description": "Pasteurized whole milk rich in calcium and natural vitamin D.",
        "price": Decimal("3.89"),
        "cost_price": Decimal("2.60"),
        "stock_quantity": 50,
        "low_stock_threshold": 15,
        "unit": "liter",
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Dairy & Eggs",
        "name": "Free-Range Large Brown Eggs",
        "sku": "DRY-EGG-002",
        "description": "Dozen grade-A brown eggs from pasture-raised hens.",
        "price": Decimal("4.29"),
        "cost_price": Decimal("2.80"),
        "stock_quantity": 6,  # Low stock trigger
        "low_stock_threshold": 12,
        "unit": "pack (12 pcs)",
        "image_url": "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Dairy & Eggs",
        "name": "Aged Cheddar Cheese Block",
        "sku": "DRY-CHS-003",
        "description": "Sharp, sharp-aged cheddar crafted using traditional dairy methods.",
        "price": Decimal("5.49"),
        "cost_price": Decimal("3.60"),
        "stock_quantity": 25,
        "low_stock_threshold": 8,
        "unit": "pack (300g)",
        "image_url": "https://images.unsplash.com/photo-1618164435735-413d3b066c9a?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Dairy & Eggs",
        "name": "Greek Style Plain Yogurt",
        "sku": "DRY-YOG-004",
        "description": "Thick, high-protein strained yogurt with zero added sugar.",
        "price": Decimal("3.19"),
        "cost_price": Decimal("2.00"),
        "stock_quantity": 30,
        "low_stock_threshold": 10,
        "unit": "tub (500g)",
        "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80"
    },

    # Bakery
    {
        "category_name": "Bakery",
        "name": "Artisan Sourdough Loaf",
        "sku": "BKY-SRD-001",
        "description": "Slow-fermented sourdough with a golden crispy crust and open crumb.",
        "price": Decimal("4.75"),
        "cost_price": Decimal("2.40"),
        "stock_quantity": 22,
        "low_stock_threshold": 8,
        "unit": "loaf",
        "image_url": "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Bakery",
        "name": "All-Butter French Croissants",
        "sku": "BKY-CRS-002",
        "description": "Flaky, layered golden croissants baked with pure European butter.",
        "price": Decimal("5.99"),
        "cost_price": Decimal("3.20"),
        "stock_quantity": 18,
        "low_stock_threshold": 10,
        "unit": "pack (4 pcs)",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Bakery",
        "name": "Whole Grain Multiseed Bagels",
        "sku": "BKY-BGL-003",
        "description": "Chewy bagels loaded with sesame, poppy, and sunflower seeds.",
        "price": Decimal("3.99"),
        "cost_price": Decimal("2.10"),
        "stock_quantity": 5,  # Low stock
        "low_stock_threshold": 10,
        "unit": "pack (5 pcs)",
        "image_url": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80"
    },

    # Beverages
    {
        "category_name": "Beverages",
        "name": "Cold-Pressed Valencia Orange Juice",
        "sku": "BEV-ORJ-001",
        "description": "100% pure squeezed orange juice with natural pulp, no preservatives.",
        "price": Decimal("4.50"),
        "cost_price": Decimal("2.80"),
        "stock_quantity": 38,
        "low_stock_threshold": 10,
        "unit": "bottle (1L)",
        "image_url": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Beverages",
        "name": "Medium Roast Arabica Coffee Beans",
        "sku": "BEV-COF-002",
        "description": "Freshly roasted single-origin Ethiopian Arabica whole beans.",
        "price": Decimal("11.99"),
        "cost_price": Decimal("7.50"),
        "stock_quantity": 25,
        "low_stock_threshold": 8,
        "unit": "bag (500g)",
        "image_url": "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Beverages",
        "name": "Sparkling Mineral Water (Lemon Essence)",
        "sku": "BEV-SPW-003",
        "description": "Natural spring sparkling water with a refreshing hint of lemon.",
        "price": Decimal("1.75"),
        "cost_price": Decimal("0.90"),
        "stock_quantity": 75,
        "low_stock_threshold": 20,
        "unit": "bottle (750ml)",
        "image_url": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80"
    },

    # Pantry & Groceries
    {
        "category_name": "Pantry & Groceries",
        "name": "Extra Virgin Olive Oil (Cold Extracted)",
        "sku": "PNT-OIL-001",
        "description": "First cold-pressed Mediterranean olive oil with a peppery finish.",
        "price": Decimal("12.49"),
        "cost_price": Decimal("8.50"),
        "stock_quantity": 30,
        "low_stock_threshold": 10,
        "unit": "bottle (750ml)",
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Pantry & Groceries",
        "name": "Premium Aged Basmati Rice",
        "sku": "PNT-RCE-002",
        "description": "Extra-long grain aromatic basmati rice aged for 2 years.",
        "price": Decimal("8.99"),
        "cost_price": Decimal("5.50"),
        "stock_quantity": 40,
        "low_stock_threshold": 15,
        "unit": "bag (5kg)",
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Pantry & Groceries",
        "name": "Italian Bronze-Cut Penne Rigate",
        "sku": "PNT-PST-003",
        "description": "Traditional durum wheat semolina pasta crafted in Italy.",
        "price": Decimal("2.69"),
        "cost_price": Decimal("1.40"),
        "stock_quantity": 55,
        "low_stock_threshold": 15,
        "unit": "pack (500g)",
        "image_url": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80"
    },

    # Snacks & Confectionery
    {
        "category_name": "Snacks & Confectionery",
        "name": "Sea Salt & Vinegar Kettle Cooked Chips",
        "sku": "SNK-CHP-001",
        "description": "Thick-cut batch cooked crunchy potato chips with tangy cider vinegar.",
        "price": Decimal("3.29"),
        "cost_price": Decimal("1.80"),
        "stock_quantity": 40,
        "low_stock_threshold": 12,
        "unit": "bag (170g)",
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Snacks & Confectionery",
        "name": "72% Dark Chocolate with Sea Salt",
        "sku": "SNK-DRK-002",
        "description": "Fair-trade Belgian dark chocolate bar infused with flakes of sea salt.",
        "price": Decimal("3.99"),
        "cost_price": Decimal("2.20"),
        "stock_quantity": 4,  # Low stock alert
        "low_stock_threshold": 10,
        "unit": "bar (100g)",
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Snacks & Confectionery",
        "name": "Roasted Almonds with Rosemary",
        "sku": "SNK-ALM-003",
        "description": "Dry-roasted California almonds lightly salted and flavored with rosemary.",
        "price": Decimal("5.79"),
        "cost_price": Decimal("3.80"),
        "stock_quantity": 28,
        "low_stock_threshold": 8,
        "unit": "pouch (250g)",
        "image_url": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80"
    },

    # Household & Care
    {
        "category_name": "Household & Care",
        "name": "Eco Multi-Surface Citrus Cleaner",
        "sku": "HSD-CLN-001",
        "description": "Plant-based biodegradable spray cleaner that cuts through grease effortlessly.",
        "price": Decimal("4.49"),
        "cost_price": Decimal("2.50"),
        "stock_quantity": 30,
        "low_stock_threshold": 10,
        "unit": "bottle (750ml)",
        "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80"
    },
    {
        "category_name": "Household & Care",
        "name": "Bamboo Fiber Kitchen Paper Towels",
        "sku": "HSD-PPR-002",
        "description": "Ultra-absorbent, sustainable 2-ply kitchen towels made from organic bamboo.",
        "price": Decimal("5.29"),
        "cost_price": Decimal("3.10"),
        "stock_quantity": 25,
        "low_stock_threshold": 8,
        "unit": "pack (4 rolls)",
        "image_url": "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80"
    }
]

def init_db():
    logger.info("Initializing database schema...")
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

    db = SessionLocal()
    try:
        # 1. Seed Super Admin
        admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not admin_user:
            logger.info(f"Creating super admin: {settings.FIRST_SUPERUSER_EMAIL}")
            admin_user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name="SmartMart Administrator",
                phone="+1 (555) 019-2834",
                role=UserRole.ADMIN,
                default_address="SmartMart HQ, 100 Supermarket Boulevard",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logger.info("Super admin created successfully.")
        else:
            logger.info("Super admin already exists.")

        # 2. Seed Default Customer
        demo_customer = db.query(User).filter(User.email == "customer@smartmart.com").first()
        if not demo_customer:
            logger.info("Creating demo customer: customer@smartmart.com")
            demo_customer = User(
                email="customer@smartmart.com",
                hashed_password=get_password_hash("customer123"),
                full_name="Alex Johnson",
                phone="+1 (555) 012-3456",
                role=UserRole.CUSTOMER,
                default_address="42 Elm Street, Apt 3B, Springfield",
                is_active=True
            )
            db.add(demo_customer)
            db.commit()
            db.refresh(demo_customer)
            logger.info("Demo customer created successfully.")

        # 3. Seed Categories
        category_map = {}
        for cat_data in CATEGORIES_DATA:
            category = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not category:
                logger.info(f"Adding category: {cat_data['name']}")
                category = Category(
                    name=cat_data["name"],
                    description=cat_data["description"],
                    image_url=cat_data["image_url"],
                    is_active=True
                )
                db.add(category)
                db.commit()
                db.refresh(category)
            else:
                if category.image_url != cat_data["image_url"]:
                    category.image_url = cat_data["image_url"]
                    db.commit()
            category_map[cat_data["name"]] = category.id

        # 4. Seed Products
        for prod_data in PRODUCTS_DATA:
            category_id = category_map.get(prod_data["category_name"])
            if not category_id:
                continue

            existing_prod = db.query(Product).filter(Product.sku == prod_data["sku"]).first()
            if not existing_prod:
                logger.info(f"Adding product: {prod_data['name']} (SKU: {prod_data['sku']})")
                product = Product(
                    name=prod_data["name"],
                    sku=prod_data["sku"],
                    description=prod_data["description"],
                    category_id=category_id,
                    price=prod_data["price"],
                    cost_price=prod_data["cost_price"],
                    stock_quantity=prod_data["stock_quantity"],
                    low_stock_threshold=prod_data["low_stock_threshold"],
                    unit=prod_data["unit"],
                    image_url=prod_data["image_url"],
                    is_active=True
                )
                db.add(product)
                db.commit()
                db.refresh(product)

                # Record initial inventory transaction
                inv_trans = InventoryTransaction(
                    product_id=product.id,
                    change_quantity=prod_data["stock_quantity"],
                    transaction_type=TransactionType.PURCHASE_ORDER,
                    reference_id="INIT-SEED-2026",
                    note="Initial supermarket catalog restocking batch",
                    created_by=admin_user.id
                )
                db.add(inv_trans)
                db.commit()
            else:
                # Synchronize updated image_url if changed
                if existing_prod.image_url != prod_data["image_url"]:
                    logger.info(f"Updating image for {existing_prod.sku}: {existing_prod.image_url} -> {prod_data['image_url']}")
                    existing_prod.image_url = prod_data["image_url"]
                    db.commit()

        logger.info("Database seeding completed successfully!")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
