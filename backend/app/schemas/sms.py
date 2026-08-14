from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class SMSInboundWebhook(BaseModel):
    From: str
    Body: str
    To: Optional[str] = None
    MessageSid: Optional[str] = None


class SMSSimulationRequest(BaseModel):
    sender: str = "+8801712345678"
    message: str


class SMSMessageOut(BaseModel):
    id: int
    message_sid: Optional[str] = None
    sender: str
    body: str
    direction: str
    is_processed: bool
    parsed_location: Optional[str] = None
    parsed_need: Optional[str] = None
    parsed_severity: Optional[str] = None
    parsed_people: Optional[int] = None
    parsed_households: Optional[int] = None
    processing_notes: Optional[str] = None
    received_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SMSParseResult(BaseModel):
    raw_message: str
    sender: str
    location: Optional[str] = None
    division: Optional[str] = None
    district: Optional[str] = None
    upazila: Optional[str] = None
    union: Optional[str] = None
    location_confidence: str  # HIGH, MEDIUM, LOW
    need_types: list[str] = []
    severity: str
    people_affected: Optional[int] = None
    households_affected: Optional[int] = None
    is_urgent: bool = False
    report_id: Optional[int] = None
