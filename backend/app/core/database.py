import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("smartmart.database")

import time

# Configure database engine
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}

# Check if PostgreSQL connection can be established, otherwise fallback to SQLite if enabled
use_fallback = False
try:
    if "sqlite" in db_url:
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)
    else:
        # PostgreSQL engine with pre-ping, connection pooling, and connection retry
        pg_engine = create_engine(
            db_url,
            connect_args={"connect_timeout": 10},
            pool_pre_ping=True,
            pool_recycle=300
        )
        # Test connection with retries for cloud environments (e.g. Render waking up)
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                with pg_engine.connect() as conn:
                    break
            except Exception as conn_err:
                if attempt < max_retries:
                    logger.warning(f"PostgreSQL connection attempt {attempt} failed ({conn_err}). Retrying in 2s...")
                    time.sleep(2)
                else:
                    raise conn_err
        engine = pg_engine
        safe_url = engine.url.render_as_string(hide_password=True)
        logger.info(f"Connected to PostgreSQL database at {safe_url}")
except Exception as e:
    if settings.USE_SQLITE_FALLBACK_IF_PG_UNAVAILABLE:
        logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite at {settings.SQLITE_DATABASE_URL}")
        connect_args = {"check_same_thread": False}
        engine = create_engine(settings.SQLITE_DATABASE_URL, connect_args=connect_args)
        use_fallback = True
    else:
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator:
    """Dependency for providing a transactional SQLAlchemy session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
