import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.assignment import ReliefAssignment
from backend.app.models.provider import ReliefProvider, ReliefResource
from backend.app.models.report import CommunityReport
from backend.app.models.user import User
from backend.app.models.enums import AssignmentStatus, AssignmentPriority, ReportStatus
from backend.app.schemas.assignment import AssignmentOut, AssignmentCreate, AssignmentStatusUpdate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=List[AssignmentOut])
def list_assignments(
    status_filter: Optional[AssignmentStatus] = Query(None, alias="status"),
    provider_id: Optional[int] = None,
    upazila: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve relief assignments and dispatch orders."""
    query = db.query(ReliefAssignment)
    if status_filter:
        query = query.filter(ReliefAssignment.status == status_filter)
    if provider_id:
        query = query.filter(ReliefAssignment.provider_id == provider_id)
    if upazila:
        query = query.filter(ReliefAssignment.destination_upazila.ilike(f"%{upazila.strip()}%"))

    assignments = query.order_by(ReliefAssignment.created_at.desc()).all()
    results = []
    for a in assignments:
        a_out = AssignmentOut.model_validate(a)
        if a.provider:
            a_out.provider_name = a.provider.name
        results.append(a_out)
    return results


@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assign_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new relief assignment order.
    Reserves provider resources in inventory ledger, links reports, and creates audit log.
    """
    provider = db.query(ReliefProvider).filter(ReliefProvider.id == assign_in.provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relief Provider not found")

    # Reserve inventory items
    try:
        alloc_items = json.loads(assign_in.allocated_resources)
        for item in alloc_items:
            cat = item.get("category")
            qty = int(item.get("quantity", 0))
            if cat and qty > 0:
                res = db.query(ReliefResource).filter(
                    ReliefResource.provider_id == provider.id,
                    ReliefResource.category == cat
                ).first()
                if res:
                    res.available_qty = max(0, res.available_qty - qty)
                    res.reserved_qty += qty
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid allocated_resources JSON: {str(e)}")

    assignment = ReliefAssignment(
        provider_id=provider.id,
        created_by_user_id=current_user.id,
        destination_division=assign_in.destination_division,
        destination_district=assign_in.destination_district,
        destination_upazila=assign_in.destination_upazila,
        destination_union=assign_in.destination_union,
        destination_locality=assign_in.destination_locality,
        destination_lat=assign_in.destination_lat,
        destination_lon=assign_in.destination_lon,
        priority=assign_in.priority,
        status=AssignmentStatus.ASSIGNED,
        allocated_resources=assign_in.allocated_resources,
        target_households=assign_in.target_households,
        target_people=assign_in.target_people,
        expected_delivery_time=assign_in.expected_delivery_time,
        notes=assign_in.notes
    )
    db.add(assignment)
    db.flush()

    # Link reports if specified or link reports in target upazila
    if assign_in.report_ids:
        db.query(CommunityReport).filter(
            CommunityReport.id.in_(assign_in.report_ids)
        ).update({"assignment_id": assignment.id, "status": ReportStatus.IN_PROGRESS}, synchronize_session=False)
    else:
        # Auto link open reports in destination upazila
        db.query(CommunityReport).filter(
            CommunityReport.upazila.ilike(assignment.destination_upazila),
            CommunityReport.status.in_([ReportStatus.UNVERIFIED, ReportStatus.VERIFIED])
        ).limit(5).update({"assignment_id": assignment.id, "status": ReportStatus.IN_PROGRESS}, synchronize_session=False)

    db.commit()
    db.refresh(assignment)

    log_audit_event(
        db=db,
        action="RELIEF_ASSIGNED",
        entity_type="ReliefAssignment",
        entity_id=assignment.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Assigned {provider.name} to {assignment.destination_upazila}, {assignment.destination_district} (Priority: {assignment.priority.value})"
    )

    a_out = AssignmentOut.model_validate(assignment)
    a_out.provider_name = provider.name
    return a_out


@router.get("/{assignment_id}", response_model=AssignmentOut)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Retrieve single assignment details."""
    assignment = db.query(ReliefAssignment).filter(ReliefAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    a_out = AssignmentOut.model_validate(assignment)
    if assignment.provider:
        a_out.provider_name = assignment.provider.name
    return a_out


@router.patch("/{assignment_id}/status", response_model=AssignmentOut)
def update_assignment_status(
    assignment_id: int,
    status_update: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the operational lifecycle state of an assignment
    (ASSIGNED -> ACCEPTED -> PREPARING -> DISPATCHED -> IN_TRANSIT -> DELIVERED / CANCELLED).
    """
    assignment = db.query(ReliefAssignment).filter(ReliefAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    old_status = assignment.status
    assignment.status = status_update.status

    if status_update.status == AssignmentStatus.DISPATCHED and not assignment.dispatched_at:
        assignment.dispatched_at = datetime.now(timezone.utc)
    elif status_update.status == AssignmentStatus.DELIVERED and not assignment.delivered_at:
        assignment.delivered_at = datetime.now(timezone.utc)

    if status_update.notes:
        assignment.notes = f"{assignment.notes or ''}\n[{datetime.now(timezone.utc).strftime('%H:%M')}] {status_update.notes}".strip()

    db.commit()
    db.refresh(assignment)

    log_audit_event(
        db=db,
        action="ASSIGNMENT_STATUS_CHANGED",
        entity_type="ReliefAssignment",
        entity_id=assignment.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Status advanced from {old_status.value} to {assignment.status.value}"
    )

    a_out = AssignmentOut.model_validate(assignment)
    if assignment.provider:
        a_out.provider_name = assignment.provider.name
    return a_out
