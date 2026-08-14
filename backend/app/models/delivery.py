from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import ResourceCategory, AssignmentStatus


class ReliefDelivery(Base):
    __tablename__ = "relief_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("relief_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    delivered_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DELIVERED, nullable=False)
    delivered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    people_served = Column(Integer, default=0, nullable=False)
    households_served = Column(Integer, default=0, nullable=False)
    proof_notes = Column(Text, nullable=True)
    distribution_point = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    assignment = relationship("ReliefAssignment", back_populates="deliveries")
    items = relationship("DeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class DeliveryItem(Base):
    __tablename__ = "delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("relief_deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_category = Column(Enum(ResourceCategory), nullable=False)
    item_name = Column(String(255), nullable=False)
    quantity_delivered = Column(Integer, nullable=False)
    unit = Column(String(50), nullable=False, default="units")

    # Relationships
    delivery = relationship("ReliefDelivery", back_populates="items")
