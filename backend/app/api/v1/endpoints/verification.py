from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.verification import VerificationRecord
from backend.app.models.institution import Institution
from backend.app.models.report import CommunityReport
from backend.app.models.user import User
from backend.app.models.enums import VerificationCondition, VerificationStatus, ReportStatus
from backend.app.schemas.verification import VerificationOut, VerificationCreate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=List[VerificationOut])
def list_verifications(
    institution_id: Optional[int] = None,
    report_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List ground-truth verification records."""
    query = db.query(VerificationRecord)
    if institution_id:
        query = query.filter(VerificationRecord.institution_id == institution_id)
    if report_id:
        query = query.filter(VerificationRecord.report_id == report_id)

    records = query.order_by(VerificationRecord.verified_at.desc()).all()
    results = []
    for r in records:
        r_out = VerificationOut.model_validate(r)
        if r.institution:
            r_out.institution_name = r.institution.name
        if r.verifier:
            r_out.verifier_name = r.verifier.full_name
        results.append(r_out)
    return results


@router.get("/signals")
def get_area_need_signals(db: Session = Depends(get_db)):
    """
    Aggregates community reports by upazila to produce Area Need Signals
    and identifies nearby educational institutions for ground-truthing.
    """
    # Group reports by district and upazila
    report_groups = db.query(
        CommunityReport.district,
        CommunityReport.upazila,
        func.count(CommunityReport.id).label("report_count"),
        func.sum(CommunityReport.households_affected).label("total_households"),
        func.sum(CommunityReport.people_affected).label("total_people")
    ).filter(
        CommunityReport.status.in_([ReportStatus.UNVERIFIED, ReportStatus.PENDING_VERIFICATION, ReportStatus.VERIFIED])
    ).group_by(CommunityReport.district, CommunityReport.upazila).all()

    signals = []
    for row in report_groups:
        district = row.district or "Feni"
        upazila = row.upazila or "Sonagazi"

        # Check if there are verifications in this upazila
        institutions = db.query(Institution).filter(
            Institution.upazila.ilike(upazila),
            Institution.district.ilike(district)
        ).all()

        inst_ids = [inst.id for inst in institutions]
        verified_records = db.query(VerificationRecord).filter(
            VerificationRecord.institution_id.in_(inst_ids)
        ).all() if inst_ids else []

        status_label = "NEEDS_VERIFICATION"
        if any(v.status == VerificationStatus.VERIFIED for v in verified_records):
            status_label = "VERIFIED"
        elif any(v.status == VerificationStatus.CONTACTED for v in verified_records):
            status_label = "CONTACTED"

        # Collect unique needs
        sample_reports = db.query(CommunityReport).filter(
            CommunityReport.upazila.ilike(upazila)
        ).limit(10).all()
        needs_set = set()
        for sr in sample_reports:
            if sr.need_type:
                for n in sr.need_type.split(","):
                    needs_set.add(n.strip())

        signals.append({
            "upazila": upazila,
            "district": district,
            "report_count": row.report_count,
            "estimated_households": row.total_households or (row.report_count * 12),
            "estimated_people": row.total_people or (row.report_count * 48),
            "needs": list(needs_set) or ["Food", "Drinking Water", "Medicine"],
            "verification_status": status_label,
            "nearby_institutions": [
                {
                    "id": inst.id,
                    "name": inst.name,
                    "type": inst.type.value,
                    "phone": inst.phone or "Not available",
                    "verification_status": inst.verification_status.value
                }
                for inst in institutions
            ]
        })

    return signals


@router.post("", response_model=VerificationOut, status_code=status.HTTP_201_CREATED)
def submit_verification(
    verification_in: VerificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a ground-truth flood verification report.
    Updates matching institution and cascades verification status to local reports.
    """
    inst = None
    if verification_in.institution_id:
        inst = db.query(Institution).filter(Institution.id == verification_in.institution_id).first()

    record = VerificationRecord(
        report_id=verification_in.report_id,
        institution_id=verification_in.institution_id,
        verifier_id=current_user.id,
        reported_condition=verification_in.reported_condition,
        status=verification_in.status,
        water_level_estimate=verification_in.water_level_estimate,
        access_road_status=verification_in.access_road_status,
        shelter_occupancy=verification_in.shelter_occupancy,
        notes=verification_in.notes
    )
    db.add(record)

    # If linked to institution, update its verification status
    if inst:
        inst.verification_status = verification_in.status
        # Also mark reports in that upazila as VERIFIED
        if verification_in.status == VerificationStatus.VERIFIED:
            db.query(CommunityReport).filter(
                CommunityReport.upazila.ilike(inst.upazila),
                CommunityReport.status == ReportStatus.UNVERIFIED
            ).update({"status": ReportStatus.VERIFIED}, synchronize_session=False)

    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        action="VERIFICATION_SUBMITTED",
        entity_type="VerificationRecord",
        entity_id=record.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Verified condition: {record.reported_condition.value} at {inst.name if inst else 'Local Zone'}"
    )

    r_out = VerificationOut.model_validate(record)
    if inst:
        r_out.institution_name = inst.name
    r_out.verifier_name = current_user.full_name
    return r_out
