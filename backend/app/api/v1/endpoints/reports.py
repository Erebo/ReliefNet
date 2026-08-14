from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_optional, get_current_user
from backend.app.models.report import CommunityReport
from backend.app.models.user import User
from backend.app.models.enums import ReportStatus, SeverityLevel, ReportSource
from backend.app.schemas.report import ReportOut, ReportCreate, ReportUpdate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=List[ReportOut])
def list_reports(
    status_filter: Optional[ReportStatus] = Query(None, alias="status"),
    severity: Optional[SeverityLevel] = None,
    upazila: Optional[str] = None,
    district: Optional[str] = None,
    source: Optional[ReportSource] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve filtered community flood distress reports."""
    query = db.query(CommunityReport)

    if status_filter:
        query = query.filter(CommunityReport.status == status_filter)
    if severity:
        query = query.filter(CommunityReport.severity == severity)
    if upazila:
        query = query.filter(CommunityReport.upazila.ilike(f"%{upazila.strip()}%"))
    if district:
        query = query.filter(CommunityReport.district.ilike(f"%{district.strip()}%"))
    if source:
        query = query.filter(CommunityReport.source == source)

    return query.order_by(CommunityReport.created_at.desc()).limit(limit).all()


@router.get("/export/geojson")
def export_reports_geojson(db: Session = Depends(get_db)):
    """Export all community distress reports as a standardized GeoJSON FeatureCollection."""
    reports = db.query(CommunityReport).all()
    features = []
    for r in reports:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [r.longitude or 91.39, r.latitude or 22.85]
            },
            "properties": {
                "id": r.id,
                "status": r.status.value,
                "severity": r.severity.value,
                "upazila": r.upazila,
                "district": r.district,
                "need_type": r.need_type,
                "households_affected": r.households_affected,
                "people_affected": r.people_affected,
                "is_trapped": r.is_trapped,
                "raw_message": r.raw_message,
                "created_at": r.created_at.isoformat()
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }


@router.get("/export/csv")
def export_reports_csv(db: Session = Depends(get_db)):
    """Export reports as CSV."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    reports = db.query(CommunityReport).order_by(CommunityReport.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Status", "Severity", "District", "Upazila", "Union", "Latitude", "Longitude", "Households", "Needs", "Sender Phone", "Message", "Created At"])

    for r in reports:
        writer.writerow([
            r.id,
            r.status.value,
            r.severity.value,
            r.district,
            r.upazila,
            r.union or "",
            r.latitude,
            r.longitude,
            r.households_affected or 0,
            r.need_type or "",
            r.sender_phone or "",
            r.raw_message,
            r.created_at.isoformat()
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reliefnet_reports.csv"}
    )


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Create a new community distress report (via Web Form or Operator intake)."""
    report = CommunityReport(
        source=report_in.source,
        sender_phone=report_in.sender_phone,
        reporter_name=report_in.reporter_name,
        raw_message=report_in.raw_message,
        division=report_in.division or "Chittagong",
        district=report_in.district or "Feni",
        upazila=report_in.upazila or "Sonagazi",
        union=report_in.union,
        locality_details=report_in.locality_details,
        latitude=report_in.latitude or 22.8500,
        longitude=report_in.longitude or 91.3900,
        location_confidence=report_in.location_confidence or "MEDIUM",
        need_type=report_in.need_type or "Food, Drinking Water",
        severity=report_in.severity,
        people_affected=report_in.people_affected or 40,
        households_affected=report_in.households_affected or 10,
        is_water_available=report_in.is_water_available,
        is_food_available=report_in.is_food_available,
        is_medical_needed=report_in.is_medical_needed,
        is_trapped=report_in.is_trapped,
        status=ReportStatus.UNVERIFIED,
        notes=report_in.notes
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_audit_event(
        db=db,
        action="REPORT_CREATED",
        entity_type="CommunityReport",
        entity_id=report.id,
        user_id=current_user.id if current_user else None,
        actor_name=current_user.full_name if current_user else "Public Web Portal",
        details=f"Created report #{report.id} in {report.upazila}, {report.district}"
    )

    return report


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a single community report."""
    report = db.query(CommunityReport).filter(CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.patch("/{report_id}", response_model=ReportOut)
def update_report(
    report_id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update report status, location triage, or assignment linking."""
    report = db.query(CommunityReport).filter(CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    update_data = report_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(report, field, val)

    db.commit()
    db.refresh(report)

    log_audit_event(
        db=db,
        action="REPORT_UPDATED",
        entity_type="CommunityReport",
        entity_id=report.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Updated report #{report.id} (Status: {report.status.value})"
    )

    return report
