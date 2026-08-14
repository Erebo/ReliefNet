from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import ContactMethod


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True)
    provider_id = Column(Integer, ForeignKey("relief_providers.id", ondelete="SET NULL"), nullable=True, index=True)
    logged_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    contact_method = Column(Enum(ContactMethod), nullable=False)
    contact_target = Column(String(255), nullable=False)  # Phone number, email, or person name
    purpose = Column(String(255), nullable=False)  # e.g., "Verification of flood level", "Inquiring boat availability"
    result = Column(String(255), nullable=False)   # e.g., "Confirmed 4ft water", "Agreed to dispatch 200 packs"
    notes = Column(Text, nullable=True)
    contacted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    institution = relationship("Institution", back_populates="communications")
    provider = relationship("ReliefProvider", back_populates="communications")
    logged_by = relationship("User")
