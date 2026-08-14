import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.v1.api import api_router
from backend.app.models import *  # Load all models
from backend.app.geo.boundary_loader import seed_geographic_data_if_empty

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("reliefnet")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created and seed data if empty
    logger.info("Initializing ReliefNet database schema...")
    Base.metadata.create_all(bind=engine)

    # Seed GIS and institutional foundation
    db = SessionLocal()
    try:
        seed_geographic_data_if_empty(db, data_dir="data")
    except Exception as e:
        logger.error(f"Error seeding geographic data: {e}", exc_info=True)
    finally:
        db.close()

    logger.info("ReliefNet platform ready.")
    yield
    logger.info("Shutting down ReliefNet...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade Emergency Coordination and Gap Detection Platform for Bangladesh Floods",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
        return response
    except Exception as exc:
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error occurred. Please check server logs."}
        )


from fastapi.responses import JSONResponse, RedirectResponse

# Root Landing & Documentation Redirect
@app.get("/", tags=["Root"])
def root_index():
    return {
        "message": "Welcome to ReliefNet (ত্রাণনেট) Bangladesh API",
        "documentation": "/api/v1/docs",
        "health": "/health",
        "status": "operational",
        "frontend_local": "http://localhost:5173",
        "frontend_docker": "http://localhost:3000"
    }


# Root Health & Readiness Probes
@app.get("/health", tags=["Health"])
def root_health():
    return {
        "status": "healthy",
        "service": "ReliefNet API",
        "environment": settings.ENVIRONMENT
    }


@app.get("/ready", tags=["Health"])
def root_ready():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "service": "ReliefNet API"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not ready", "error": str(e)}
        )
    finally:
        db.close()


# Mount versioned API routes
app.include_router(api_router, prefix=settings.API_V1_STR)
