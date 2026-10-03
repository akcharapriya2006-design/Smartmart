import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("smartmart.database")

# Configure database engine
db_url = settings.DATABASE_URL
connect_args = {}

# Check if PostgreSQL connection can be established, otherwise fallback to SQLite if enabled
use_fallback = False
try:
    if "sqlite" in db_url:
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)
    else:
        # Test connecting to PostgreSQL with short timeout
        test_engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        safe_url = engine.url.render_as_string(hide_password=True)
        logger.info(f"Connected to PostgreSQL database at {safe_url}")
except Exception as e:
    if settings.USE_SQLITE_FALLBACK_IF_PG_UNAVAILABLE:
        logger.warning(f"Could not connect to PostgreSQL. Falling back to SQLite at {settings.SQLITE_DATABASE_URL}")
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
