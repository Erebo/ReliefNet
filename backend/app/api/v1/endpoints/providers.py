import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_role
from backend.app.models.provider import ReliefProvider, ReliefResource
from backend.app.models.user import User
from backend.app.models.enums import ProviderType, ResourceCategory
from backend.app.schemas.provider import (
    ProviderOut, ProviderCreate, ProviderUpdate,
    ResourceOut, ResourceCreate, ResourceUpdate
)
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=List[ProviderOut])
def list_providers(
    type: Optional[ProviderType] = None,
    upazila: Optional[str] = None,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Retrieve list of relief providers and their real-time inventory balances."""
    query = db.query(ReliefProvider)
    if type:
        query = query.filter(ReliefProvider.type == type)
    if is_available is not None:
        query = query.filter(ReliefProvider.is_available == is_available)

    providers = query.order_by(ReliefProvider.name.asc()).all()

    if upazila:
        filtered = []
        upz_lower = upazila.lower()
        for p in providers:
            try:
                op_list = json.loads(p.operating_upazilas or "[]")
                if any(upz_lower in op.lower() for op in op_list) or not op_list:
                    filtered.append(p)
            except Exception:
                filtered.append(p)
        return filtered

    return providers


@router.post("", response_model=ProviderOut, status_code=status.HTTP_201_CREATED)
def create_provider(
    provider_in: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new relief provider organization."""
    provider = ReliefProvider(
        name=provider_in.name,
        bangla_name=provider_in.bangla_name,
        type=provider_in.type,
        contact_person=provider_in.contact_person,
        phone=provider_in.phone,
        email=provider_in.email,
        website=provider_in.website,
        address=provider_in.address,
        latitude=provider_in.latitude,
        longitude=provider_in.longitude,
        operating_upazilas=provider_in.operating_upazilas or "[]",
        is_available=provider_in.is_available,
        notes=provider_in.notes,
        is_demo_data=provider_in.is_demo_data,
        is_verified=True
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)

    log_audit_event(
        db=db,
        action="PROVIDER_CREATED",
        entity_type="ReliefProvider",
        entity_id=provider.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Created provider {provider.name}"
    )

    return provider


@router.get("/{provider_id}", response_model=ProviderOut)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    """Get single provider details."""
    provider = db.query(ReliefProvider).filter(ReliefProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relief Provider not found")
    return provider


@router.put("/{provider_id}", response_model=ProviderOut)
def update_provider(
    provider_id: int,
    provider_update: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update relief provider details."""
    provider = db.query(ReliefProvider).filter(ReliefProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relief Provider not found")

    update_data = provider_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(provider, field, val)

    db.commit()
    db.refresh(provider)

    log_audit_event(
        db=db,
        action="PROVIDER_UPDATED",
        entity_type="ReliefProvider",
        entity_id=provider.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Updated provider {provider.name}"
    )

    return provider


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"]))
):
    """Delete a relief provider."""
    provider = db.query(ReliefProvider).filter(ReliefProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relief Provider not found")

    db.delete(provider)
    db.commit()

    log_audit_event(
        db=db,
        action="PROVIDER_DELETED",
        entity_type="ReliefProvider",
        entity_id=provider_id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Deleted provider {provider.name}"
    )
    return None


# Resource Endpoints
@router.post("/{provider_id}/resources", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
def add_provider_resource(
    provider_id: int,
    res_in: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a resource inventory item to a provider."""
    provider = db.query(ReliefProvider).filter(ReliefProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relief Provider not found")

    resource = ReliefResource(
        provider_id=provider_id,
        category=res_in.category,
        item_name=res_in.item_name,
        available_qty=res_in.available_qty,
        reserved_qty=res_in.reserved_qty,
        delivered_qty=res_in.delivered_qty,
        unit=res_in.unit
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    log_audit_event(
        db=db,
        action="RESOURCE_ADDED",
        entity_type="ReliefResource",
        entity_id=resource.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Added resource {resource.item_name} ({resource.available_qty} {resource.unit}) to {provider.name}"
    )

    return resource


@router.patch("/{provider_id}/resources/{resource_id}", response_model=ResourceOut)
def update_provider_resource(
    provider_id: int,
    resource_id: int,
    res_update: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update stock counts for a provider resource."""
    resource = db.query(ReliefResource).filter(
        ReliefResource.id == resource_id,
        ReliefResource.provider_id == provider_id
    ).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource item not found")

    update_data = res_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(resource, field, val)

    db.commit()
    db.refresh(resource)

    log_audit_event(
        db=db,
        action="RESOURCE_UPDATED",
        entity_type="ReliefResource",
        entity_id=resource.id,
        user_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Updated inventory for {resource.item_name}"
    )

    return resource


@router.delete("/{provider_id}/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider_resource(
    provider_id: int,
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a resource inventory item."""
    resource = db.query(ReliefResource).filter(
        ReliefResource.id == resource_id,
        ReliefResource.provider_id == provider_id
    ).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource item not found")

    db.delete(resource)
    db.commit()
    return None
