# Import base types from shared OpenAPI-generated models
# These are the single source of truth for all API types
import sys
from pathlib import Path

# Add shared package to path
shared_path = Path(__file__).parent.parent.parent.parent / "packages" / "shared" / "generated" / "python"
sys.path.insert(0, str(shared_path))

from models import (
    # Enums
    DocumentType as SharedDocumentType,
    DocumentStatus,
    ReturnStatus,
    ReturnType,
    AppointmentType,
    AppointmentStatus,
    CommunicationType as SharedCommunicationType,
    CommunicationStatus,
    CommunicationDirection,
    CommunicationTrigger,
    KanbanStatus,
    KanbanPriority,
    UserRole,
    PaymentStatus,
    PaymentMethod,
    EntityType,
    # Models
    Customer,
    Document,
    TaxReturn,
    Appointment,
    Communication,
    KanbanFeature,
    User,
    Address,
    BankingInfo,
    RoutingSheet,
    Payment,
    Error,
    PaginationMeta,
)

# Import agent-specific extended models (OCR extraction results, etc.)
from .documents import (
    DocumentType,  # Local enum with additional values for OCR
    ExtractedW2,
    Extracted1099,
    ExtractedDocument,
    DocumentExtractionResult,
)
from .communications import (
    CommunicationType,  # Local enum
    CommunicationTemplate,
    CommunicationMessage,
)

__all__ = [
    # Shared models (from OpenAPI)
    "Customer",
    "Document",
    "TaxReturn",
    "Appointment",
    "Communication",
    "KanbanFeature",
    "User",
    "Address",
    "BankingInfo",
    "RoutingSheet",
    "Payment",
    "Error",
    "PaginationMeta",
    # Shared enums
    "SharedDocumentType",
    "DocumentStatus",
    "ReturnStatus",
    "ReturnType",
    "AppointmentType",
    "AppointmentStatus",
    "SharedCommunicationType",
    "CommunicationStatus",
    "CommunicationDirection",
    "CommunicationTrigger",
    "KanbanStatus",
    "KanbanPriority",
    "UserRole",
    "PaymentStatus",
    "PaymentMethod",
    "EntityType",
    # Agent-specific models (OCR extraction)
    "DocumentType",
    "ExtractedW2",
    "Extracted1099",
    "ExtractedDocument",
    "DocumentExtractionResult",
    "CommunicationType",
    "CommunicationTemplate",
    "CommunicationMessage",
]
