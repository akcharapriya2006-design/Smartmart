import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smartmart.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Automatically verify database schema and seed initial supermarket data on startup."""
    try:
        from app.initial_data import init_db
        init_db()
        logger.info("Startup: Database schema verified and seed data initialized successfully.")
    except Exception as e:
        logger.warning(f"Startup: Database initialization encountered an issue: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack Supermarket Management & Online Shopping REST API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Configure CORS
origins = (
    list(settings.BACKEND_CORS_ORIGINS)
    if isinstance(settings.BACKEND_CORS_ORIGINS, (list, tuple))
    else [str(settings.BACKEND_CORS_ORIGINS)]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.api import api_router

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

# Check for Angular production build directory
candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/dist/frontend/browser")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist/frontend/browser")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../static")),
]
frontend_dist = next(
    (p for p in candidates if os.path.isdir(p) and os.path.isfile(os.path.join(p, "index.html"))),
    None
)

if frontend_dist:
    logger.info(f"Serving Angular SPA from: {frontend_dist}")
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return {"detail": "Not Found"}
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": f"{settings.API_V1_STR}/docs"
        }

