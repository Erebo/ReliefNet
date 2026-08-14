from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import InstitutionType, VerificationStatus


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    bangla_name = Column(String(255), nullable=True)
    type = Column(Enum(InstitutionType), nullable=False, index=True)
    division = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    upazila = Column(String(100), nullable=False, index=True)
    union = Column(String(100), nullable=True, index=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    phone = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    source = Column(String(100), nullable=False, default="OpenStreetMap / BANBEIS")
    source_id = Column(String(100), nullable=True)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    last_verified_at = Column(DateTime, nullable=True)
    capacity_est = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    verifications = relationship("VerificationRecord", back_populates="institution")
    communications = relationship("Communication", back_populates="institution")
