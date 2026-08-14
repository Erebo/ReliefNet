from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_optional, get_current_user
from backend.app.models.institution import Institution
from backend.app.models.report import CommunityReport
from backend.app.models.communication import Communication
from backend.app.models.user import User
from backend.app.models.enums import InstitutionType, VerificationStatus, ContactMethod
from backend.app.schemas.institution import InstitutionOut, InstitutionCreate, InstitutionUpdate
from backend.app.schemas.communication import CommunicationCreate, CommunicationOut
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=List[InstitutionOut])
def list_institutions(
    division: Optional[str] = None,
    district: Optional[str] = None,
    upazila: Optional[str] = None,
    type: Optional[InstitutionType] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List institutions with viewport bounding-box and administrative filters."""
    query = db.query(Institution)

    if division:
        query = query.filter(Institution.division.ilike(division))
    if district:
        query = query.filter(Institution.district.ilike(district))
    if upazila:
        query = query.filter(Institution.upazila.ilike(upazila))
    if type:
        query = query.filter(Institution.type == type)

    # Viewport Bounding Box Filtering
    if min_lat is not None and max_lat is not None:
        query = query.filter(Institution.latitude.between(min_lat, max_lat))
    if min_lon is not None and max_lon is not None:
        query = query.filter(Institution.longitude.between(min_lon, max_lon))

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Institution.name.ilike(term),
                Institution.bangla_name.ilike(term),
                Institution.upazila.ilike(term)
            )
        )

    institutions = query.limit(limit).all()

    # Enrich with nearby report counts for the upazila
    result = []
    for inst in institutions:
        inst_dict = InstitutionOut.model_validate(inst)
        # Count nearby reports in same upazila
        count = db.query(func.count(CommunityReport.id)).filter(
            CommunityReport.upazila.ilike(inst.upazila)
        ).scalar() or 0
        inst_dict.nearby_reports_count = count
        result.append(inst_dict)

    return result


@router.get("/{institution_id}", response_model=InstitutionOut)
def get_institution(institution_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a single institution."""
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
    
    inst_out = InstitutionOut.model_validate(inst)
    count = db.query(func.count(CommunityReport.id)).filter(
        CommunityReport.upazila.ilike(inst.upazila)
    ).scalar() or 0
    inst_out.nearby_reports_count = count
    return inst_out


@router.patch("/{institution_id}", response_model=InstitutionOut)
def update_institution(
    institution_id: int,
    inst_update: InstitutionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update institution contact or verification status."""
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    update_data = inst_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(inst, field, val)

    db.commit()
    db.refresh(inst)

    log_audit_event(
        db=db,
        action="INSTITUTION_UPDATED",
        entity_type="Institution",
        entity_id=inst.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Updated institution {inst.name}"
    )

    inst_out = InstitutionOut.model_validate(inst)
    count = db.query(func.count(CommunityReport.id)).filter(
        CommunityReport.upazila.ilike(inst.upazila)
    ).scalar() or 0
    inst_out.nearby_reports_count = count
    return inst_out


@router.post("/{institution_id}/contact-log", response_model=CommunicationOut, status_code=status.HTTP_201_CREATED)
def log_institution_contact(
    institution_id: int,
    comm_in: CommunicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log an internal communication/phone/email record with an institution anchor."""
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    comm = Communication(
        institution_id=institution_id,
        logged_by_user_id=current_user.id,
        contact_method=comm_in.contact_method,
        contact_target=comm_in.contact_target,
        purpose=comm_in.purpose,
        result=comm_in.result,
        notes=comm_in.notes
    )
    db.add(comm)

    # If contacted, update institution verification status to CONTACTED if still PENDING
    if inst.verification_status == VerificationStatus.PENDING:
        inst.verification_status = VerificationStatus.CONTACTED

    db.commit()
    db.refresh(comm)

    log_audit_event(
        db=db,
        action="INSTITUTION_CONTACTED",
        entity_type="Communication",
        entity_id=comm.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Contacted {inst.name} via {comm.contact_method.value}: {comm.purpose}"
    )

    comm_out = CommunicationOut.model_validate(comm)
    comm_out.logged_by_name = current_user.full_name
    return comm_out


@router.get("/{institution_id}/communications", response_model=List[CommunicationOut])
def get_institution_communications(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve all communication history for an institution."""
    comms = db.query(Communication).filter(Communication.institution_id == institution_id).order_by(Communication.contacted_at.desc()).all()
    results = []
    for c in comms:
        c_out = CommunicationOut.model_validate(c)
        if c.logged_by:
            c_out.logged_by_name = c.logged_by.full_name
        results.append(c_out)
    return results
