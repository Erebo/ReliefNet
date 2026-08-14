from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # e.g., "REPORT_CREATED", "STATUS_VERIFIED", "PROVIDER_ASSIGNED", "DISPATCHED", "DELIVERY_CONFIRMED"
    entity_type = Column(String(100), nullable=False, index=True)  # e.g., "CommunityReport", "ReliefAssignment", "Institution"
    entity_id = Column(Integer, nullable=True, index=True)
    actor_name = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)  # JSON or human readable details
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
