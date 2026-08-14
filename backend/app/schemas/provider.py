from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import ProviderType, ResourceCategory


class ResourceBase(BaseModel):
    category: ResourceCategory
    item_name: str
    available_qty: int = 0
    reserved_qty: int = 0
    delivered_qty: int = 0
    unit: str = "units"


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    category: Optional[ResourceCategory] = None
    item_name: Optional[str] = None
    available_qty: Optional[int] = None
    reserved_qty: Optional[int] = None
    delivered_qty: Optional[int] = None
    unit: Optional[str] = None


class ResourceOut(ResourceBase):
    id: int
    provider_id: int
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class ProviderBase(BaseModel):
    name: str
    bangla_name: Optional[str] = None
    type: ProviderType
    contact_person: str
    phone: str
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_upazilas: Optional[str] = "[]"  # JSON list of upazila names
    is_available: bool = True
    notes: Optional[str] = None
    is_demo_data: bool = True


class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    bangla_name: Optional[str] = None
    type: Optional[ProviderType] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_upazilas: Optional[str] = None
    is_available: Optional[bool] = None
    notes: Optional[str] = None


class ProviderOut(ProviderBase):
    id: int
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    resources: List[ResourceOut] = []

    model_config = ConfigDict(from_attributes=True)
