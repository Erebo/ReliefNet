from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import ReportSource, ReportStatus, SeverityLevel


class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(Enum(ReportSource), default=ReportSource.WEB, nullable=False, index=True)
    sender_phone = Column(String(50), nullable=True, index=True)
    reporter_name = Column(String(255), nullable=True)
    raw_message = Column(Text, nullable=False)
    
    # Location Hierarchy
    division = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    upazila = Column(String(100), nullable=True, index=True)
    union = Column(String(100), nullable=True, index=True)
    locality_details = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    location_confidence = Column(String(50), default="MEDIUM", nullable=False)  # HIGH, MEDIUM, LOW

    # Impact & Needs
    need_type = Column(String(255), nullable=True)  # e.g., "Food, Drinking Water, Medicine, Boat Rescue"
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.MODERATE, nullable=False, index=True)
    people_affected = Column(Integer, nullable=True)
    households_affected = Column(Integer, nullable=True)
    is_water_available = Column(Boolean, default=True, nullable=False)
    is_food_available = Column(Boolean, default=True, nullable=False)
    is_medical_needed = Column(Boolean, default=False, nullable=False)
    is_trapped = Column(Boolean, default=False, nullable=False)

    # Workflow Status
    status = Column(Enum(ReportStatus), default=ReportStatus.UNVERIFIED, nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("relief_assignments.id", ondelete="SET NULL"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    verifications = relationship("VerificationRecord", back_populates="report")
    assignment = relationship("ReliefAssignment", back_populates="reports", foreign_keys=[assignment_id])
