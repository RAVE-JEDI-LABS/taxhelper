from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    W2 = "w2"
    FORM_1099_R = "1099-r"
    FORM_1099_G = "1099-g"
    FORM_1099_INT = "1099-int"
    FORM_1099_DIV = "1099-div"
    FORM_1099_NEC = "1099-nec"
    K1 = "k1"
    OTHER = "other"


class ExtractedW2(BaseModel):
    """Extracted data from W-2 form."""

    employer_name: Optional[str] = Field(None, description="Employer name (Box c)")
    employer_ein: Optional[str] = Field(None, description="Employer EIN (Box b)")
    employer_address: Optional[str] = Field(None, description="Employer address")
    employee_ssn: Optional[str] = Field(None, description="Employee SSN (Box a) - last 4 only")
    employee_name: Optional[str] = Field(None, description="Employee name (Box e)")
    employee_address: Optional[str] = Field(None, description="Employee address (Box f)")

    wages: Optional[float] = Field(None, description="Wages, tips, other compensation (Box 1)")
    federal_tax_withheld: Optional[float] = Field(None, description="Federal income tax withheld (Box 2)")
    social_security_wages: Optional[float] = Field(None, description="Social security wages (Box 3)")
    social_security_tax: Optional[float] = Field(None, description="Social security tax withheld (Box 4)")
    medicare_wages: Optional[float] = Field(None, description="Medicare wages and tips (Box 5)")
    medicare_tax: Optional[float] = Field(None, description="Medicare tax withheld (Box 6)")

    state: Optional[str] = Field(None, description="State (Box 15)")
    state_wages: Optional[float] = Field(None, description="State wages (Box 16)")
    state_tax_withheld: Optional[float] = Field(None, description="State income tax (Box 17)")

    tax_year: Optional[int] = Field(None, description="Tax year from form")


class Extracted1099(BaseModel):
    """Extracted data from various 1099 forms."""

    form_type: Optional[str] = Field(None, description="1099 type (R, G, INT, DIV, NEC, etc.)")
    payer_name: Optional[str] = Field(None, description="Payer's name")
    payer_tin: Optional[str] = Field(None, description="Payer's TIN")
    recipient_name: Optional[str] = Field(None, description="Recipient's name")
    recipient_ssn: Optional[str] = Field(None, description="Recipient's SSN - last 4 only")

    # Common amount fields
    gross_distribution: Optional[float] = Field(None, description="Gross distribution (1099-R)")
    taxable_amount: Optional[float] = Field(None, description="Taxable amount")
    federal_tax_withheld: Optional[float] = Field(None, description="Federal income tax withheld")

    # 1099-INT specific
    interest_income: Optional[float] = Field(None, description="Interest income (1099-INT)")

    # 1099-DIV specific
    ordinary_dividends: Optional[float] = Field(None, description="Ordinary dividends (1099-DIV)")
    qualified_dividends: Optional[float] = Field(None, description="Qualified dividends (1099-DIV)")

    # 1099-NEC specific
    nonemployee_compensation: Optional[float] = Field(None, description="Nonemployee compensation (1099-NEC)")

    # 1099-G specific
    unemployment_compensation: Optional[float] = Field(None, description="Unemployment compensation (1099-G)")

    tax_year: Optional[int] = Field(None, description="Tax year from form")


class ExtractedDocument(BaseModel):
    """Generic extracted document data."""

    document_type: DocumentType
    w2_data: Optional[ExtractedW2] = None
    form_1099_data: Optional[Extracted1099] = None
    raw_text: Optional[str] = Field(None, description="Raw OCR text")
    confidence_score: float = Field(0.0, ge=0.0, le=1.0, description="Extraction confidence")
    notes: Optional[str] = Field(None, description="Additional notes or warnings")


class DocumentExtractionResult(BaseModel):
    """Result of document extraction process."""

    document_id: str
    customer_id: str
    success: bool
    extracted_data: Optional[ExtractedDocument] = None
    error_message: Optional[str] = None
    processing_time_ms: Optional[int] = None
