from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartMart Supermarket API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = "smartmart_supermarket_jwt_secret_key_prod_2026_x9f7a8"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/smartmart"
    USE_SQLITE_FALLBACK_IF_PG_UNAVAILABLE: bool = False
    SQLITE_DATABASE_URL: str = "sqlite:///./smartmart.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Initial Admin Seed
    FIRST_SUPERUSER_EMAIL: str = "admin@smartmart.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="allow")

settings = Settings()
