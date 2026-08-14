from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.schemas.audit import AuditLogOut

router = APIRouter()


@router.get("", response_model=List[AuditLogOut])
def get_audit_trail(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve immutable system audit log."""
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
