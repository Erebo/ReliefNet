from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.core.database import get_db
from backend.app.models.geo import AdministrativeArea
from backend.app.models.institution import Institution
from backend.app.models.enums import AdminLevel
from backend.app.schemas.geo import AdministrativeAreaOut, SearchResult

router = APIRouter()


@router.get("/divisions", response_model=List[AdministrativeAreaOut])
def get_divisions(db: Session = Depends(get_db)):
    """Retrieve all 8 Bangladesh divisions."""
    return db.query(AdministrativeArea).filter(AdministrativeArea.level == AdminLevel.DIVISION).all()


@router.get("/districts", response_model=List[AdministrativeAreaOut])
def get_districts(
    division_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieve districts, optionally filtered by division."""
    query = db.query(AdministrativeArea).filter(AdministrativeArea.level == AdminLevel.DISTRICT)
    if division_id:
        query = query.filter(AdministrativeArea.parent_id == division_id)
    return query.all()


@router.get("/upazilas", response_model=List[AdministrativeAreaOut])
def get_upazilas(
    district_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieve upazilas, optionally filtered by district."""
    query = db.query(AdministrativeArea).filter(AdministrativeArea.level == AdminLevel.UPAZILA)
    if district_id:
        query = query.filter(AdministrativeArea.parent_id == district_id)
    return query.all()


@router.get("/boundaries", response_model=List[AdministrativeAreaOut])
def get_boundaries(
    level: Optional[AdminLevel] = None,
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieve administrative boundary metadata by level and parent."""
    query = db.query(AdministrativeArea)
    if level:
        query = query.filter(AdministrativeArea.level == level)
    if parent_id:
        query = query.filter(AdministrativeArea.parent_id == parent_id)
    return query.all()


@router.get("/search", response_model=List[SearchResult])
def search_locations(
    q: str = Query(..., min_length=2, description="Search query string"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Unified fast search across Divisions, Districts, Upazilas, and Institutions."""
    term = f"%{q.strip()}%"
    results: List[SearchResult] = []

    # 1. Search Administrative Areas
    admin_matches = db.query(AdministrativeArea).filter(
        or_(
            AdministrativeArea.name.ilike(term),
            AdministrativeArea.bangla_name.ilike(term)
        )
    ).limit(limit).all()

    for area in admin_matches:
        results.append(
            SearchResult(
                id=area.id,
                title=area.name,
                bangla_title=area.bangla_name,
                type=area.level.value,
                lat=area.center_lat,
                lon=area.center_lon,
                subtitle=f"{area.level.value} level boundary",
                confidence="HIGH"
            )
        )

    # 2. Search Institutions
    inst_matches = db.query(Institution).filter(
        or_(
            Institution.name.ilike(term),
            Institution.bangla_name.ilike(term),
            Institution.upazila.ilike(term),
            Institution.district.ilike(term)
        )
    ).limit(limit).all()

    for inst in inst_matches:
        results.append(
            SearchResult(
                id=inst.id,
                title=inst.name,
                bangla_title=inst.bangla_name,
                type=inst.type.value,
                lat=inst.latitude,
                lon=inst.longitude,
                subtitle=f"{inst.type.value} in {inst.upazila}, {inst.district}",
                confidence="HIGH"
            )
        )

    return results[:limit]
