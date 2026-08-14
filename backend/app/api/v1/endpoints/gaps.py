from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.gap import GapAlertOut
from backend.app.services.gap_service import detect_operational_gaps

router = APIRouter()


@router.get("", response_model=List[GapAlertOut])
def get_gap_alerts(db: Session = Depends(get_db)):
    """
    Evaluates real-time spatial gap indicators:
    CRITICAL_GAP, RESPONSE_GAP, COVERAGE_GAP, VERIFICATION_GAP, and AID_DUPLICATION.
    """
    return detect_operational_gaps(db)


@router.get("/export/csv")
def export_gaps_csv(db: Session = Depends(get_db)):
    """Export all detected operational gap alerts as CSV."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    gaps = detect_operational_gaps(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Gap Type", "Severity", "Title", "District", "Upazila", "Reports", "Households Affected", "Assigned Providers", "Delivered Food", "Recommended Action"])

    for g in gaps:
        writer.writerow([
            g.id,
            g.gap_type.value,
            g.severity.value,
            g.title,
            g.district,
            g.upazila,
            g.report_count,
            g.verified_households_affected,
            g.assigned_providers_count,
            g.delivered_food_packages,
            g.recommended_action
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reliefnet_gap_alerts.csv"}
    )
