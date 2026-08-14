from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import AssignmentPriority, AssignmentStatus


class ReliefAssignment(Base):
    __tablename__ = "relief_assignments"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("relief_providers.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Destination
    destination_division = Column(String(100), nullable=False)
    destination_district = Column(String(100), nullable=False, index=True)
    destination_upazila = Column(String(100), nullable=False, index=True)
    destination_union = Column(String(100), nullable=True, index=True)
    destination_locality = Column(String(255), nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lon = Column(Float, nullable=True)

    # Assignment Details
    priority = Column(Enum(AssignmentPriority), default=AssignmentPriority.HIGH, nullable=False, index=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, nullable=False, index=True)
    allocated_resources = Column(Text, nullable=False)  # JSON: [{"category": "FOOD", "quantity": 500, "unit": "packages"}, ...]
    target_households = Column(Integer, nullable=True)
    target_people = Column(Integer, nullable=True)
    
    # Timestamps & Tracking
    expected_delivery_time = Column(DateTime, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    provider = relationship("ReliefProvider", back_populates="assignments")
    deliveries = relationship("ReliefDelivery", back_populates="assignment", cascade="all, delete-orphan")
    reports = relationship("CommunityReport", back_populates="assignment", foreign_keys="CommunityReport.assignment_id")
