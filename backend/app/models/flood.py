from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, Boolean
from backend.app.core.database import Base
from backend.app.models.enums import SeverityLevel


class FloodSimulation(Base):
    __tablename__ = "flood_simulations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.SEVERE, nullable=False)
    affected_district = Column(String(100), nullable=False)
    affected_upazilas = Column(Text, nullable=False)  # JSON array of upazila names
    water_level_m_est = Column(Float, default=1.5, nullable=False)
    source_label = Column(String(50), default="SIMULATION", nullable=False)
    geojson_polygon = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    simulated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
