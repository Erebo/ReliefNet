from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from backend.app.core.database import Base


class SMSMessage(Base):
    __tablename__ = "sms_messages"

    id = Column(Integer, primary_key=True, index=True)
    message_sid = Column(String(100), nullable=True, index=True)
    sender = Column(String(50), nullable=False, index=True)
    recipient = Column(String(50), nullable=True)
    body = Column(Text, nullable=False)
    direction = Column(String(20), default="INBOUND", nullable=False)  # INBOUND, OUTBOUND
    is_processed = Column(Boolean, default=False, nullable=False)
    parsed_location = Column(String(255), nullable=True)
    parsed_need = Column(String(255), nullable=True)
    parsed_severity = Column(String(50), nullable=True)
    parsed_people = Column(Integer, nullable=True)
    parsed_households = Column(Integer, nullable=True)
    processing_notes = Column(Text, nullable=True)
    received_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
