from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import ProviderType, ResourceCategory


class ReliefProvider(Base):
    __tablename__ = "relief_providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    bangla_name = Column(String(255), nullable=True)
    type = Column(Enum(ProviderType), nullable=False, index=True)
    contact_person = Column(String(255), nullable=False)
    phone = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    operating_upazilas = Column(Text, nullable=True)  # JSON array of upazila names
    is_verified = Column(Boolean, default=True, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    is_demo_data = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    resources = relationship("ReliefResource", back_populates="provider", cascade="all, delete-orphan")
    assignments = relationship("ReliefAssignment", back_populates="provider")
    communications = relationship("Communication", back_populates="provider")


class ReliefResource(Base):
    __tablename__ = "relief_resources"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("relief_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(Enum(ResourceCategory), nullable=False, index=True)
    item_name = Column(String(255), nullable=False)
    available_qty = Column(Integer, default=0, nullable=False)
    reserved_qty = Column(Integer, default=0, nullable=False)
    delivered_qty = Column(Integer, default=0, nullable=False)
    unit = Column(String(50), nullable=False, default="units")  # packages, liters, kits, boats, persons
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    provider = relationship("ReliefProvider", back_populates="resources")
