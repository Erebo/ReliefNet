import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_optional, get_current_user
from backend.app.models.sms import SMSMessage
from backend.app.models.report import CommunityReport
from backend.app.models.enums import ReportSource, ReportStatus, SeverityLevel
from backend.app.schemas.sms import SMSSimulationRequest, SMSMessageOut, SMSParseResult
from backend.app.sms.parser import parse_sms_report
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


@router.post("/webhook", response_model=SMSParseResult)
async def inbound_sms_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    To: str = Form(None),
    MessageSid: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Standard HTTP webhook for external SMS gateways (e.g. Twilio, Infobip, local telcos).
    Parses Bangla/English distress text and generates an active CommunityReport.
    """
    return process_inbound_sms(sender=From, body=Body, message_sid=MessageSid, db=db)


@router.post("/simulate", response_model=SMSParseResult)
def simulate_sms(
    req: SMSSimulationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional)
):
    """
    Operator SMS Simulator: Ingests simulated Bangla/English crisis messages
    through the identical processing and parser pipeline.
    """
    sid = f"SIM_{hash(req.sender + req.message)}"
    result = process_inbound_sms(
        sender=req.sender,
        body=req.message,
        message_sid=sid,
        db=db,
        user_id=current_user.id if current_user else None,
        actor_name=current_user.full_name if current_user else "Operator Simulation"
    )
    return result


def process_inbound_sms(
    sender: str,
    body: str,
    message_sid: str,
    db: Session,
    user_id: int = None,
    actor_name: str = "SMS Ingestion Gateway"
) -> SMSParseResult:
    """Core deterministic processing pipeline for inbound SMS messages."""
    parsed = parse_sms_report(sender=sender, raw_message=body)

    # 1. Store raw SMS record in audit table
    sms_record = SMSMessage(
        message_sid=message_sid,
        sender=sender,
        recipient="+8801700000000",
        body=body,
        direction="INBOUND",
        is_processed=True,
        parsed_location=parsed.get("location"),
        parsed_need=parsed.get("need_type_string"),
        parsed_severity=parsed.get("severity"),
        parsed_people=parsed.get("people_affected"),
        parsed_households=parsed.get("households_affected"),
        processing_notes=f"Location confidence: {parsed.get('location_confidence')}"
    )
    db.add(sms_record)
    db.flush()

    # 2. Create CommunityReport in database
    report = CommunityReport(
        source=ReportSource.SMS,
        sender_phone=sender,
        reporter_name=f"SMS Sender ({sender[-4:]})",
        raw_message=body,
        division=parsed.get("division"),
        district=parsed.get("district"),
        upazila=parsed.get("upazila"),
        union=parsed.get("union"),
        latitude=parsed.get("lat"),
        longitude=parsed.get("lon"),
        location_confidence=parsed.get("location_confidence"),
        need_type=parsed.get("need_type_string"),
        severity=SeverityLevel(parsed.get("severity")),
        people_affected=parsed.get("people_affected"),
        households_affected=parsed.get("households_affected"),
        is_trapped=parsed.get("is_trapped", False),
        status=ReportStatus.UNVERIFIED,
        notes=f"Ingested via SMS Pipeline (Message ID #{sms_record.id})"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # 3. Log Audit Trail
    log_audit_event(
        db=db,
        action="SMS_REPORT_INGESTED",
        entity_type="CommunityReport",
        entity_id=report.id,
        user_id=user_id,
        actor_name=actor_name,
        details=f"Ingested SMS from {sender} -> {parsed.get('upazila')}, {parsed.get('district')} ({parsed.get('severity')})"
    )

    return SMSParseResult(
        raw_message=body,
        sender=sender,
        location=parsed.get("location"),
        division=parsed.get("division"),
        district=parsed.get("district"),
        upazila=parsed.get("upazila"),
        union=parsed.get("union"),
        location_confidence=parsed.get("location_confidence"),
        need_types=parsed.get("need_types", []),
        severity=parsed.get("severity"),
        people_affected=parsed.get("people_affected"),
        households_affected=parsed.get("households_affected"),
        is_urgent=parsed.get("is_urgent", False),
        report_id=report.id
    )


@router.get("/messages", response_model=List[SMSMessageOut])
def get_sms_messages(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve raw incoming/outgoing SMS history."""
    return db.query(SMSMessage).order_by(SMSMessage.received_at.desc()).limit(limit).all()
