from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger("reliefnet.sms")


class SmsProvider(ABC):
    """Abstract base provider for SMS gateways (Twilio, Infobip, local telcos, Mock)."""

    @abstractmethod
    async def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        pass


class MockSmsProvider(SmsProvider):
    """Production mock SMS provider used for zero-credential operation & simulation."""

    async def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        logger.info(f"[MOCK SMS DISPATCHED] To: {to_number} | Message: {message}")
        return {
            "status": "delivered",
            "provider": "MockSmsProvider",
            "recipient": to_number,
            "message_sid": f"SM_MOCK_{hash(to_number + message)}"
        }

    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        return True


def get_sms_provider() -> SmsProvider:
    return MockSmsProvider()
