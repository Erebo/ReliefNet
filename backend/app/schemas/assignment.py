from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import AssignmentPriority, AssignmentStatus


class AllocatedResourceItem(BaseModel):
    category: str
    item_name: str
    quantity: int
    unit: str = "units"


class AssignmentBase(BaseModel):
    provider_id: int
    destination_division: str
    destination_district: str
    destination_upazila: str
    destination_union: Optional[str] = None
    destination_locality: Optional[str] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    priority: AssignmentPriority = AssignmentPriority.HIGH
    allocated_resources: str  # JSON list of AllocatedResourceItem
    target_households: Optional[int] = None
    target_people: Optional[int] = None
    expected_delivery_time: Optional[datetime] = None
    notes: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    report_ids: Optional[List[int]] = []


class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus
    notes: Optional[str] = None


class AssignmentOut(AssignmentBase):
    id: int
    created_by_user_id: Optional[int] = None
    status: AssignmentStatus
    dispatched_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    provider_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
