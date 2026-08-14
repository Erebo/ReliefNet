import json
from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.report import CommunityReport
from backend.app.models.assignment import ReliefAssignment
from backend.app.models.delivery import ReliefDelivery, DeliveryItem
from backend.app.models.verification import VerificationRecord
from backend.app.models.enums import GapType, SeverityLevel, ReportStatus, AssignmentStatus, VerificationStatus
from backend.app.schemas.gap import GapAlertOut


def detect_operational_gaps(db: Session) -> List[GapAlertOut]:
    """
    Automated rule-based spatial gap and aid duplication detection engine.
    Scans real-time report tallies, verification statuses, assignments, and deliveries.
    """
    alerts: List[GapAlertOut] = []
    now = datetime.now(timezone.utc)

    # 1. Fetch grouped community reports by upazila
    report_tallies = db.query(
        CommunityReport.district,
        CommunityReport.upazila,
        func.count(CommunityReport.id).label("report_count"),
        func.sum(CommunityReport.households_affected).label("total_hh"),
        func.sum(CommunityReport.people_affected).label("total_people")
    ).group_by(CommunityReport.district, CommunityReport.upazila).all()

    for row in report_tallies:
        district = row.district or "Feni"
        upazila = row.upazila or "Sonagazi"
        report_count = row.report_count
        est_hh = row.total_hh or (report_count * 12)

        # Check verifications
        verifications = db.query(VerificationRecord).join(VerificationRecord.institution).filter(
            VerificationRecord.status == VerificationStatus.VERIFIED
        ).all()
        is_verified = any(v.institution and v.institution.upazila.lower() == upazila.lower() for v in verifications)

        # Check active assignments in this upazila
        active_assignments = db.query(ReliefAssignment).filter(
            ReliefAssignment.destination_upazila.ilike(upazila),
            ReliefAssignment.status.in_([
                AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED,
                AssignmentStatus.PREPARING, AssignmentStatus.DISPATCHED,
                AssignmentStatus.IN_TRANSIT
            ])
        ).all()

        # Check completed deliveries in this upazila
        completed_assignments = db.query(ReliefAssignment).filter(
            ReliefAssignment.destination_upazila.ilike(upazila),
            ReliefAssignment.status == AssignmentStatus.DELIVERED
        ).all()

        total_delivered_hh = 0
        total_delivered_food = 0
        total_delivered_water = 0
        for ca in completed_assignments:
            for deliv in ca.deliveries:
                total_delivered_hh += deliv.households_served
                for itm in deliv.items:
                    if itm.resource_category.value == "FOOD":
                        total_delivered_food += itm.quantity_delivered
                    elif itm.resource_category.value == "WATER":
                        total_delivered_water += itm.quantity_delivered

        total_allocated_food = 0
        total_allocated_water = 0
        for asg in active_assignments + completed_assignments:
            try:
                items = json.loads(asg.allocated_resources)
                for itm in items:
                    if itm.get("category") == "FOOD":
                        total_allocated_food += int(itm.get("quantity", 0))
                    elif itm.get("category") == "WATER":
                        total_allocated_water += int(itm.get("quantity", 0))
            except Exception:
                pass

        # RULE A: CRITICAL GAP (Verified Need + 0 Active Assignment + 0 Delivery)
        if (is_verified or report_count >= 5) and len(active_assignments) == 0 and len(completed_assignments) == 0:
            alerts.append(
                GapAlertOut(
                    id=f"GAP_CRIT_{upazila.upper()}",
                    gap_type=GapType.CRITICAL_GAP,
                    severity=SeverityLevel.CRITICAL,
                    title=f"Critical Aid Gap: {upazila}, {district}",
                    district=district,
                    upazila=upazila,
                    report_count=report_count,
                    verified_households_affected=est_hh,
                    assigned_providers_count=0,
                    allocated_food_packages=0,
                    allocated_water_units=0,
                    delivered_food_packages=0,
                    delivered_water_units=0,
                    description=f"{report_count} urgent reports ({est_hh} estimated affected households) in {upazila} have no relief provider assigned or dispatched.",
                    recommended_action="Match & assign relief provider immediately.",
                    action_type="ASSIGN_PROVIDER"
                )
            )

        # RULE B: VERIFICATION GAP (High reports + No Verification)
        elif report_count >= 4 and not is_verified and len(active_assignments) == 0:
            alerts.append(
                GapAlertOut(
                    id=f"GAP_VERIF_{upazila.upper()}",
                    gap_type=GapType.VERIFICATION_GAP,
                    severity=SeverityLevel.SEVERE,
                    title=f"Verification Gap: {upazila}, {district}",
                    district=district,
                    upazila=upazila,
                    report_count=report_count,
                    verified_households_affected=est_hh,
                    assigned_providers_count=0,
                    allocated_food_packages=0,
                    allocated_water_units=0,
                    delivered_food_packages=0,
                    delivered_water_units=0,
                    description=f"{report_count} incoming distress reports from {upazila} lack local institutional ground-truth verification.",
                    recommended_action="Contact local schools or colleges for situation check.",
                    action_type="VERIFY_AREA"
                )
            )

        # RULE C: AID DUPLICATION ALERT (> 2 providers + > 150% estimated food demand)
        if len(active_assignments) >= 2 and total_allocated_food > (est_hh * 3):
            alerts.append(
                GapAlertOut(
                    id=f"GAP_DUP_{upazila.upper()}",
                    gap_type=GapType.AID_DUPLICATION,
                    severity=SeverityLevel.MODERATE,
                    title=f"Possible Aid Duplication: {upazila}, {district}",
                    district=district,
                    upazila=upazila,
                    report_count=report_count,
                    verified_households_affected=est_hh,
                    assigned_providers_count=len(active_assignments),
                    allocated_food_packages=total_allocated_food,
                    allocated_water_units=total_allocated_water,
                    delivered_food_packages=total_delivered_food,
                    delivered_water_units=total_delivered_water,
                    description=f"{len(active_assignments)} relief providers allocated {total_allocated_food} food packages for {est_hh} households in {upazila}, potentially over-serving this sector while adjacent zones wait.",
                    recommended_action="Review operational coverage & consider re-routing squads.",
                    action_type="REVIEW_COVERAGE"
                )
            )

    # RULE D: RESPONSE GAP (Active assignment overdue)
    all_active_assignments = db.query(ReliefAssignment).filter(
        ReliefAssignment.status.in_([AssignmentStatus.DISPATCHED, AssignmentStatus.IN_TRANSIT])
    ).all()

    for asg in all_active_assignments:
        if asg.expected_delivery_time:
            exp_time = asg.expected_delivery_time.replace(tzinfo=timezone.utc) if asg.expected_delivery_time.tzinfo is None else asg.expected_delivery_time
            if now > exp_time:
                diff_hours = int((now - exp_time).total_seconds() / 3600)
                alerts.append(
                    GapAlertOut(
                        id=f"GAP_RESP_{asg.id}",
                        gap_type=GapType.RESPONSE_GAP,
                        severity=SeverityLevel.SEVERE,
                        title=f"Response Overdue: Operation #{asg.id} -> {asg.destination_upazila}",
                        district=asg.destination_district,
                        upazila=asg.destination_upazila,
                        report_count=1,
                        verified_households_affected=asg.target_households or 50,
                        assigned_providers_count=1,
                        allocated_food_packages=0,
                        allocated_water_units=0,
                        delivered_food_packages=0,
                        delivered_water_units=0,
                        description=f"Relief convoy dispatched by {asg.provider.name if asg.provider else 'Provider'} to {asg.destination_upazila} is overdue by {diff_hours} hours.",
                        recommended_action="Contact field convoy & confirm in-transit obstacles.",
                        action_type="EXPEDITE_DISPATCH"
                    )
                )

    return alerts
