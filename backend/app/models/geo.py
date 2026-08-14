from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import AdminLevel


class AdministrativeArea(Base):
    __tablename__ = "administrative_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    bangla_name = Column(String(100), nullable=True)
    level = Column(Enum(AdminLevel), nullable=False, index=True)
    pcode = Column(String(50), nullable=True, index=True)
    parent_id = Column(Integer, ForeignKey("administrative_areas.id"), nullable=True, index=True)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    bounding_box = Column(Text, nullable=True)  # JSON [min_lon, min_lat, max_lon, max_lat]
    geojson_geometry = Column(Text, nullable=True)  # GeoJSON polygon/multipolygon string
    population_est = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Self-referential hierarchy
    parent = relationship("AdministrativeArea", remote_side=[id], backref="children")
