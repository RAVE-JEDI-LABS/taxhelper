from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class CommunicationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    CALL = "call"


class CommunicationTemplate(BaseModel):
    """Template for automated communications."""

    id: str
    name: str
    trigger_status: Optional[str] = Field(None, description="Return status that triggers this template")
    subject_template: Optional[str] = Field(None, description="Email subject template")
    body_template: str = Field(..., description="Message body template with placeholders")
    comm_type: CommunicationType = CommunicationType.EMAIL

    def render(self, **kwargs) -> tuple[Optional[str], str]:
        """Render template with provided variables."""
        subject = self.subject_template.format(**kwargs) if self.subject_template else None
        body = self.body_template.format(**kwargs)
        return subject, body


class CommunicationMessage(BaseModel):
    """A communication message to be sent."""

    customer_id: str
    comm_type: CommunicationType
    subject: Optional[str] = None
    content: str
    triggered_by: str = "agent"

    # Customer info for personalization
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None


# Default templates for various statuses
DEFAULT_TEMPLATES = {
    "documents_complete": CommunicationTemplate(
        id="docs_complete",
        name="Documents Complete",
        trigger_status="documents_complete",
        subject_template="Gordon Ulen CPA - Documents Received for {tax_year}",
        body_template="""Dear {customer_name},

We have received all your tax documents for {tax_year}. Your return is now in our preparation queue.

We will contact you when your return is ready for review.

Thank you for choosing Gordon Ulen CPA.

Best regards,
Gordon Ulen CPA Team""",
        comm_type=CommunicationType.EMAIL,
    ),

    "ready_for_signing": CommunicationTemplate(
        id="ready_signing",
        name="Ready for Signing",
        trigger_status="ready_for_signing",
        subject_template="Your {tax_year} Tax Return is Ready - Gordon Ulen CPA",
        body_template="""Dear {customer_name},

Great news! Your {tax_year} tax return is complete and ready for your signature.

Please call our office at (XXX) XXX-XXXX or reply to this email to schedule a time to review and sign your return.

You can also:
- Stop by our office during business hours
- Request electronic signing via our client portal

Thank you for your patience!

Best regards,
Gordon Ulen CPA Team""",
        comm_type=CommunicationType.EMAIL,
    ),

    "waiting_on_client": CommunicationTemplate(
        id="waiting_client",
        name="Waiting on Client",
        trigger_status="waiting_on_client",
        subject_template="Action Required: Missing Information for {tax_year} Return",
        body_template="""Dear {customer_name},

We are working on your {tax_year} tax return and need additional information from you:

{missing_items}

Please provide this information as soon as possible so we can complete your return.

You can:
- Upload documents through our client portal
- Email them to info@gordonullencpa.com
- Drop them off at our office

If you have any questions, please don't hesitate to contact us.

Best regards,
Gordon Ulen CPA Team""",
        comm_type=CommunicationType.EMAIL,
    ),

    "filed": CommunicationTemplate(
        id="return_filed",
        name="Return Filed",
        trigger_status="filed",
        subject_template="Your {tax_year} Tax Return Has Been Filed!",
        body_template="""Dear {customer_name},

Your {tax_year} tax return has been successfully filed with the IRS.

{refund_info}

Please keep a copy of your return for your records. If you have any questions, don't hesitate to reach out.

Thank you for choosing Gordon Ulen CPA for your tax needs!

Best regards,
Gordon Ulen CPA Team""",
        comm_type=CommunicationType.EMAIL,
    ),
}
