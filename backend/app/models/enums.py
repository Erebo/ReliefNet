import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"
    VERIFIER = "VERIFIER"
    RELIEF_PROVIDER = "RELIEF_PROVIDER"
    VIEWER = "VIEWER"


class AdminLevel(str, enum.Enum):
    DIVISION = "DIVISION"
    DISTRICT = "DISTRICT"
    UPAZILA = "UPAZILA"
    UNION = "UNION"


class InstitutionType(str, enum.Enum):
    SCHOOL = "SCHOOL"
    COLLEGE = "COLLEGE"
    NGO = "NGO"
    CYCLONE_SHELTER = "CYCLONE_SHELTER"
    HOSPITAL = "HOSPITAL"


class ProviderType(str, enum.Enum):
    GOV = "GOV"
    INGO = "INGO"
    LOCAL_NGO = "LOCAL_NGO"
    VOLUNTEER = "VOLUNTEER"


class ResourceCategory(str, enum.Enum):
    FOOD = "FOOD"
    WATER = "WATER"
    MEDICINE = "MEDICINE"
    HYGIENE = "HYGIENE"
    SHELTER = "SHELTER"
    BOAT = "BOAT"
    VOLUNTEER = "VOLUNTEER"
    TRANSPORT = "TRANSPORT"


class ReportSource(str, enum.Enum):
    SMS = "SMS"
    WEB = "WEB"
    OPERATOR = "OPERATOR"
    IMPORTED = "IMPORTED"


class SeverityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    SEVERE = "SEVERE"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


class ReportStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class VerificationCondition(str, enum.Enum):
    SAFE = "SAFE"
    PARTIALLY_FLOODED = "PARTIALLY_FLOODED"
    SEVERELY_FLOODED = "SEVERELY_FLOODED"
    EVACUATED = "EVACUATED"
    UNABLE_TO_CONFIRM = "UNABLE_TO_CONFIRM"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONTACTED = "CONTACTED"
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    REJECTED = "REJECTED"


class AssignmentPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    PARTIALLY_DELIVERED = "PARTIALLY_DELIVERED"
    CANCELLED = "CANCELLED"


class ContactMethod(str, enum.Enum):
    PHONE = "PHONE"
    EMAIL = "EMAIL"
    SMS = "SMS"
    IN_PERSON = "IN_PERSON"


class GapType(str, enum.Enum):
    CRITICAL_GAP = "CRITICAL_GAP"
    RESPONSE_GAP = "RESPONSE_GAP"
    COVERAGE_GAP = "COVERAGE_GAP"
    VERIFICATION_GAP = "VERIFICATION_GAP"
    AID_DUPLICATION = "AID_DUPLICATION"
