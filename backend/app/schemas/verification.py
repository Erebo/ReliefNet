from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import VerificationCondition, VerificationStatus


class VerificationBase(BaseModel):
    report_id: Optional[int] = None
    institution_id: Optional[int] = None
    reported_condition: VerificationCondition
    status: VerificationStatus = VerificationStatus.VERIFIED
    water_level_estimate: Optional[str] = None
    access_road_status: Optional[str] = None
    shelter_occupancy: Optional[int] = None
    notes: Optional[str] = None


class VerificationCreate(VerificationBase):
    pass


class VerificationOut(VerificationBase):
    id: int
    verifier_id: Optional[int] = None
    verified_at: datetime
    institution_name: Optional[str] = None
    verifier_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
