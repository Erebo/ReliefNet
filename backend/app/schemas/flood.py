from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FloodSimulationOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    affected_district: str
    affected_upazila: str
    source_label: str = "SIMULATION"
    estimated_water_depth: Optional[str] = None
    geojson_polygon: str
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)
