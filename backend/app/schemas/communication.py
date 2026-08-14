from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import ContactMethod


class CommunicationBase(BaseModel):
    institution_id: Optional[int] = None
    provider_id: Optional[int] = None
    contact_method: ContactMethod
    contact_target: str
    purpose: str
    result: str
    notes: Optional[str] = None


class CommunicationCreate(CommunicationBase):
    pass


class CommunicationOut(CommunicationBase):
    id: int
    logged_by_user_id: Optional[int] = None
    contacted_at: datetime
    logged_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
