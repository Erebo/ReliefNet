from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import AdminLevel


class AdministrativeAreaBase(BaseModel):
    name: str
    bangla_name: Optional[str] = None
    level: AdminLevel
    pcode: Optional[str] = None
    parent_id: Optional[int] = None
    center_lat: float
    center_lon: float
    bounding_box: Optional[str] = None
    geojson_geometry: Optional[str] = None
    population_est: Optional[int] = None


class AdministrativeAreaCreate(AdministrativeAreaBase):
    pass


class AdministrativeAreaOut(AdministrativeAreaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class SearchResult(BaseModel):
    id: int
    title: str
    bangla_title: Optional[str] = None
    type: str  # DIVISION, DISTRICT, UPAZILA, UNION, SCHOOL, COLLEGE, NGO, REPORT
    lat: float
    lon: float
    subtitle: Optional[str] = None
    confidence: Optional[str] = "HIGH"
