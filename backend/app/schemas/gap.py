from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from backend.app.models.enums import GapType, SeverityLevel


class GapAlertOut(BaseModel):
    id: str
    gap_type: GapType
    severity: SeverityLevel
    title: str
    district: str
    upazila: str
    union: Optional[str] = None
    locality: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    report_count: int = 0
    verified_households_affected: int = 0
    assigned_providers_count: int = 0
    allocated_food_packages: int = 0
    allocated_water_units: int = 0
    delivered_food_packages: int = 0
    delivered_water_units: int = 0
    description: str
    recommended_action: str
    action_type: str  # ASSIGN_PROVIDER, EXPEDITE_DISPATCH, REVIEW_COVERAGE, VERIFY_AREA
