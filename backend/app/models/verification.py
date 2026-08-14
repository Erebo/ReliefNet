from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import VerificationCondition, VerificationStatus


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("community_reports.id", ondelete="SET NULL"), nullable=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True)
    verifier_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    reported_condition = Column(Enum(VerificationCondition), nullable=False)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.VERIFIED, nullable=False, index=True)
    water_level_estimate = Column(String(100), nullable=True)  # e.g., "3-5 feet", "Submerged ground floor"
    access_road_status = Column(String(100), nullable=True)   # e.g., "Cut off - Boat only", "Partial truck access"
    shelter_occupancy = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    report = relationship("CommunityReport", back_populates="verifications")
    institution = relationship("Institution", back_populates="verifications")
    verifier = relationship("User", back_populates="verifications")
