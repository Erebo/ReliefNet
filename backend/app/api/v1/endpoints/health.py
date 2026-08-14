from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.database import get_db

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check():
    """Liveness probe: verifies the API process is alive."""
    return {
        "status": "healthy",
        "service": "ReliefNet API",
        "version": "1.0.0"
    }


@router.get("/ready", tags=["Health"])
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe: verifies database connectivity and core services."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "service": "ReliefNet API"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )
