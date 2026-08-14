from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import InstitutionType, VerificationStatus


class InstitutionBase(BaseModel):
    name: str
    bangla_name: Optional[str] = None
    type: InstitutionType
    division: str
    district: str
    upazila: str
    union: Optional[str] = None
    address: Optional[str] = None
    latitude: float
    longitude: float
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = "OpenStreetMap / BANBEIS"
    source_id: Optional[str] = None
    capacity_est: Optional[int] = None


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    bangla_name: Optional[str] = None
    type: Optional[InstitutionType] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    capacity_est: Optional[int] = None
    verification_status: Optional[VerificationStatus] = None


class InstitutionOut(InstitutionBase):
    id: int
    verification_status: VerificationStatus
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    nearby_reports_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
