from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AuditLogCreate(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    actor_name: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    actor_name: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
