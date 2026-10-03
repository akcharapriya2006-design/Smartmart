import sys
from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Starting database migration for orderstatus enum...")
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        # Check current enum values
        res = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'orderstatus';")).fetchall()
        existing_labels = [r[0] for r in res]
        print(f"Current enum labels: {existing_labels}")

        if "PREPARING" not in existing_labels:
            print("Adding 'PREPARING' to orderstatus enum...")
            conn.execute(text("ALTER TYPE orderstatus ADD VALUE 'PREPARING';"))
        else:
            print("'PREPARING' already exists.")

        if "DELIVERED" not in existing_labels:
            print("Adding 'DELIVERED' to orderstatus enum...")
            conn.execute(text("ALTER TYPE orderstatus ADD VALUE 'DELIVERED';"))
        else:
            print("'DELIVERED' already exists.")

        # Update existing orders if needed: PROCESSING -> PREPARING, COMPLETED -> DELIVERED
        # Note: can run in normal transaction or autocommit
        conn.execute(text("UPDATE orders SET status = 'PREPARING' WHERE status = 'PROCESSING';"))
        conn.execute(text("UPDATE orders SET status = 'DELIVERED' WHERE status = 'COMPLETED';"))

        # Verify
        res_after = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'orderstatus';")).fetchall()
        print(f"Updated enum labels: {[r[0] for r in res_after]}")

        # Check orders count by status
        counts = conn.execute(text("SELECT status, count(*) FROM orders GROUP BY status;")).fetchall()
        print(f"Order counts by status: {counts}")

    print("Migration finished successfully.")

if __name__ == "__main__":
    migrate()
