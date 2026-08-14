from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import ResourceCategory, AssignmentStatus


class DeliveryItemBase(BaseModel):
    resource_category: ResourceCategory
    item_name: str
    quantity_delivered: int
    unit: str = "units"


class DeliveryItemCreate(DeliveryItemBase):
    pass


class DeliveryItemOut(DeliveryItemBase):
    id: int
    delivery_id: int

    model_config = ConfigDict(from_attributes=True)


class DeliveryBase(BaseModel):
    assignment_id: int
    people_served: int
    households_served: int
    proof_notes: Optional[str] = None
    distribution_point: Optional[str] = None
    status: AssignmentStatus = AssignmentStatus.DELIVERED


class DeliveryCreate(DeliveryBase):
    items: List[DeliveryItemCreate]


class DeliveryOut(DeliveryBase):
    id: int
    delivered_by_user_id: Optional[int] = None
    delivered_at: datetime
    created_at: datetime
    items: List[DeliveryItemOut] = []

    model_config = ConfigDict(from_attributes=True)
