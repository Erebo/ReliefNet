from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import ReportSource, ReportStatus, SeverityLevel


class ReportBase(BaseModel):
    source: ReportSource = ReportSource.WEB
    sender_phone: Optional[str] = None
    reporter_name: Optional[str] = None
    raw_message: str
    division: Optional[str] = None
    district: Optional[str] = None
    upazila: Optional[str] = None
    union: Optional[str] = None
    locality_details: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_confidence: Optional[str] = "MEDIUM"
    need_type: Optional[str] = None
    severity: SeverityLevel = SeverityLevel.MODERATE
    people_affected: Optional[int] = None
    households_affected: Optional[int] = None
    is_water_available: bool = True
    is_food_available: bool = True
    is_medical_needed: bool = False
    is_trapped: bool = False
    notes: Optional[str] = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    division: Optional[str] = None
    district: Optional[str] = None
    upazila: Optional[str] = None
    union: Optional[str] = None
    locality_details: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_confidence: Optional[str] = None
    need_type: Optional[str] = None
    severity: Optional[SeverityLevel] = None
    people_affected: Optional[int] = None
    households_affected: Optional[int] = None
    status: Optional[ReportStatus] = None
    assignment_id: Optional[int] = None
    notes: Optional[str] = None


class ReportOut(ReportBase):
    id: int
    status: ReportStatus
    assignment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
