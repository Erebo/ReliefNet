from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.report import CommunityReport
from backend.app.models.verification import VerificationRecord
from backend.app.models.assignment import ReliefAssignment
from backend.app.models.provider import ReliefProvider
from backend.app.models.audit import AuditLog
from backend.app.models.enums import ReportStatus, SeverityLevel, AssignmentStatus, VerificationStatus
from backend.app.services.gap_service import detect_operational_gaps

router = APIRouter()


@router.get("/metrics")
def get_overview_metrics(db: Session = Depends(get_db)):
    """
    Real-time KPI metrics calculated directly from database entities:
    - Critical Needs
    - Pending Verification
    - Active Operations
    - In Transit
    - Delivered Aid
    - Critical Gaps
    """
    critical_needs_count = db.query(func.count(CommunityReport.id)).filter(
        CommunityReport.severity.in_([SeverityLevel.CRITICAL, SeverityLevel.SEVERE]),
        CommunityReport.status.in_([ReportStatus.UNVERIFIED, ReportStatus.VERIFIED, ReportStatus.PENDING_VERIFICATION])
    ).scalar() or 0

    pending_verification_count = db.query(func.count(CommunityReport.id)).filter(
        CommunityReport.status.in_([ReportStatus.UNVERIFIED, ReportStatus.PENDING_VERIFICATION])
    ).scalar() or 0

    active_operations_count = db.query(func.count(ReliefAssignment.id)).filter(
        ReliefAssignment.status.in_([
            AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED,
            AssignmentStatus.PREPARING, AssignmentStatus.DISPATCHED,
            AssignmentStatus.IN_TRANSIT
        ])
    ).scalar() or 0

    in_transit_count = db.query(func.count(ReliefAssignment.id)).filter(
        ReliefAssignment.status.in_([AssignmentStatus.DISPATCHED, AssignmentStatus.IN_TRANSIT])
    ).scalar() or 0

    delivered_aid_count = db.query(func.count(ReliefAssignment.id)).filter(
        ReliefAssignment.status == AssignmentStatus.DELIVERED
    ).scalar() or 0

    gaps = detect_operational_gaps(db)
    critical_gaps_count = len([g for g in gaps if g.gap_type.value == "CRITICAL_GAP"])

    total_reports = db.query(func.count(CommunityReport.id)).scalar() or 0
    total_providers = db.query(func.count(ReliefProvider.id)).scalar() or 0

    return {
        "critical_needs": critical_needs_count,
        "pending_verifications": pending_verification_count,
        "active_operations": active_operations_count,
        "in_transit": in_transit_count,
        "delivered_aid": delivered_aid_count,
        "critical_gaps": critical_gaps_count,
        "total_reports": total_reports,
        "total_providers": total_providers,
        "active_gap_alerts": gaps[:5]
    }


@router.get("/recent-activity")
def get_recent_activity(db: Session = Depends(get_db)):
    """Retrieve top 10 most recent operational activities."""
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
