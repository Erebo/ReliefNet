import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.delivery import ReliefDelivery, DeliveryItem
from backend.app.models.assignment import ReliefAssignment
from backend.app.models.provider import ReliefResource
from backend.app.models.report import CommunityReport
from backend.app.models.user import User
from backend.app.models.enums import AssignmentStatus, ReportStatus
from backend.app.schemas.delivery import DeliveryOut, DeliveryCreate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=List[DeliveryOut])
def list_deliveries(
    assignment_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieve ground-truth relief deliveries."""
    query = db.query(ReliefDelivery)
    if assignment_id:
        query = query.filter(ReliefDelivery.assignment_id == assignment_id)
    return query.order_by(ReliefDelivery.delivered_at.desc()).all()


@router.post("", response_model=DeliveryOut, status_code=status.HTTP_201_CREATED)
def record_delivery_confirmation(
    delivery_in: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits ground delivery confirmation with actual quantities served.
    Deducts reserved resources, credits delivered resources in provider ledger,
    advances assignment to DELIVERED / PARTIALLY_DELIVERED, and resolves linked reports.
    """
    assignment = db.query(ReliefAssignment).filter(ReliefAssignment.id == delivery_in.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relief Assignment not found")

    delivery = ReliefDelivery(
        assignment_id=assignment.id,
        delivered_by_user_id=current_user.id,
        status=delivery_in.status,
        delivered_at=datetime.now(timezone.utc),
        people_served=delivery_in.people_served,
        households_served=delivery_in.households_served,
        proof_notes=delivery_in.proof_notes,
        distribution_point=delivery_in.distribution_point or f"{assignment.destination_upazila} Relief Center"
    )
    db.add(delivery)
    db.flush()

    # Process items and adjust inventory ledger
    for item in delivery_in.items:
        d_item = DeliveryItem(
            delivery_id=delivery.id,
            resource_category=item.resource_category,
            item_name=item.item_name,
            quantity_delivered=item.quantity_delivered,
            unit=item.unit
        )
        db.add(d_item)

        # Update provider inventory ledger
        res = db.query(ReliefResource).filter(
            ReliefResource.provider_id == assignment.provider_id,
            ReliefResource.category == item.resource_category
        ).first()
        if res:
            res.reserved_qty = max(0, res.reserved_qty - item.quantity_delivered)
            res.delivered_qty += item.quantity_delivered

    # Update assignment status
    assignment.status = delivery_in.status
    assignment.delivered_at = datetime.now(timezone.utc)

    # Resolve linked reports
    db.query(CommunityReport).filter(
        CommunityReport.assignment_id == assignment.id
    ).update({"status": ReportStatus.RESOLVED}, synchronize_session=False)

    db.commit()
    db.refresh(delivery)

    log_audit_event(
        db=db,
        action="DELIVERY_CONFIRMED",
        entity_type="ReliefDelivery",
        entity_id=delivery.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Confirmed delivery for Assignment #{assignment.id}: {delivery.people_served} people ({delivery.households_served} households) served in {assignment.destination_upazila}"
    )

    return delivery
