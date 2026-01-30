import base64
import re
from typing import Optional
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

from ..shared.config import settings
from ..models.documents import (
    DocumentType,
    ExtractedW2,
    Extracted1099,
    ExtractedDocument,
)


class DocumentExtractor:
    """
    Extracts structured data from tax documents using Claude Vision.

    REPLACES GRUNTWORX - GruntWorx charges $0.45 per page for OCR.
    This agent provides the same functionality at no per-page cost.

    Supports W-2, 1099 variants, K-1, and other common tax forms.
    Extracted data can be manually entered into Drake tax software.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.ocr_model
        self.llm = ChatAnthropic(
            model=self.model_name,
            api_key=settings.anthropic_api_key,
            max_tokens=4096,
        )

    async def extract_from_image(
        self,
        image_data: bytes,
        media_type: str = "image/jpeg",
        hint_document_type: Optional[DocumentType] = None,
    ) -> ExtractedDocument:
        """
        Extract structured data from a document image.

        Args:
            image_data: Raw image bytes
            media_type: MIME type (image/jpeg, image/png, application/pdf)
            hint_document_type: Optional hint about expected document type

        Returns:
            ExtractedDocument with structured data
        """
        # Encode image to base64
        base64_image = base64.standard_b64encode(image_data).decode("utf-8")

        # Build the prompt
        prompt = self._build_extraction_prompt(hint_document_type)

        # Create message with image
        message = HumanMessage(
            content=[
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64_image,
                    },
                },
                {"type": "text", "text": prompt},
            ]
        )

        # Call Claude Vision
        response = await self.llm.ainvoke([message])
        response_text = response.content

        # Parse the response
        return self._parse_extraction_response(response_text, hint_document_type)

    def _build_extraction_prompt(self, hint_type: Optional[DocumentType]) -> str:
        """Build the extraction prompt for Claude."""
        type_hint = ""
        if hint_type:
            type_hint = f"This document is expected to be a {hint_type.value} form. "

        return f"""You are an expert tax document processor. {type_hint}Analyze this tax document image and extract all relevant information.

First, identify the document type:
- W-2: Wage and Tax Statement
- 1099-R: Distributions from Pensions, Annuities, IRAs, etc.
- 1099-G: Government Payments (unemployment, state refunds)
- 1099-INT: Interest Income
- 1099-DIV: Dividends and Distributions
- 1099-NEC: Nonemployee Compensation
- K-1: Partner's/Shareholder's Share of Income
- Other: Any other tax document

Then extract the following information in a structured format:

For W-2:
- Employer information (name, EIN, address)
- Employee information (name, last 4 of SSN, address)
- Box 1: Wages
- Box 2: Federal tax withheld
- Box 3-6: Social Security and Medicare wages/taxes
- Box 15-17: State information

For 1099 forms:
- Payer information
- Recipient information (last 4 of SSN only)
- All relevant box amounts based on form type

IMPORTANT:
- Only extract the last 4 digits of any SSN for security
- If a field is not visible or unclear, mark it as null
- Include a confidence score (0-1) for your overall extraction
- Note any warnings or issues with the document quality

Respond in this exact JSON format:
{{
  "document_type": "w2|1099-r|1099-g|1099-int|1099-div|1099-nec|k1|other",
  "confidence_score": 0.95,
  "tax_year": 2024,
  "notes": "any warnings or issues",
  "extracted_fields": {{
    // fields specific to document type
  }}
}}"""

    def _parse_extraction_response(
        self,
        response_text: str,
        hint_type: Optional[DocumentType],
    ) -> ExtractedDocument:
        """Parse Claude's response into structured data."""
        import json

        # Try to extract JSON from response
        try:
            # Find JSON in response (may be wrapped in markdown code blocks)
            json_match = re.search(r"\{[\s\S]*\}", response_text)
            if not json_match:
                raise ValueError("No JSON found in response")

            data = json.loads(json_match.group())
        except (json.JSONDecodeError, ValueError) as e:
            return ExtractedDocument(
                document_type=hint_type or DocumentType.OTHER,
                confidence_score=0.0,
                notes=f"Failed to parse extraction response: {e}",
                raw_text=response_text[:1000],
            )

        # Determine document type
        doc_type_str = data.get("document_type", "other").lower()
        doc_type_map = {
            "w2": DocumentType.W2,
            "w-2": DocumentType.W2,
            "1099-r": DocumentType.FORM_1099_R,
            "1099-g": DocumentType.FORM_1099_G,
            "1099-int": DocumentType.FORM_1099_INT,
            "1099-div": DocumentType.FORM_1099_DIV,
            "1099-nec": DocumentType.FORM_1099_NEC,
            "k1": DocumentType.K1,
            "k-1": DocumentType.K1,
        }
        document_type = doc_type_map.get(doc_type_str, DocumentType.OTHER)

        # Extract fields based on type
        fields = data.get("extracted_fields", {})
        w2_data = None
        form_1099_data = None

        if document_type == DocumentType.W2:
            w2_data = ExtractedW2(
                employer_name=fields.get("employer_name"),
                employer_ein=fields.get("employer_ein"),
                employer_address=fields.get("employer_address"),
                employee_name=fields.get("employee_name"),
                employee_ssn=fields.get("employee_ssn_last4"),
                employee_address=fields.get("employee_address"),
                wages=self._parse_amount(fields.get("wages")),
                federal_tax_withheld=self._parse_amount(fields.get("federal_tax_withheld")),
                social_security_wages=self._parse_amount(fields.get("social_security_wages")),
                social_security_tax=self._parse_amount(fields.get("social_security_tax")),
                medicare_wages=self._parse_amount(fields.get("medicare_wages")),
                medicare_tax=self._parse_amount(fields.get("medicare_tax")),
                state=fields.get("state"),
                state_wages=self._parse_amount(fields.get("state_wages")),
                state_tax_withheld=self._parse_amount(fields.get("state_tax_withheld")),
                tax_year=data.get("tax_year"),
            )
        elif document_type.value.startswith("1099"):
            form_1099_data = Extracted1099(
                form_type=document_type.value,
                payer_name=fields.get("payer_name"),
                payer_tin=fields.get("payer_tin"),
                recipient_name=fields.get("recipient_name"),
                recipient_ssn=fields.get("recipient_ssn_last4"),
                gross_distribution=self._parse_amount(fields.get("gross_distribution")),
                taxable_amount=self._parse_amount(fields.get("taxable_amount")),
                federal_tax_withheld=self._parse_amount(fields.get("federal_tax_withheld")),
                interest_income=self._parse_amount(fields.get("interest_income")),
                ordinary_dividends=self._parse_amount(fields.get("ordinary_dividends")),
                qualified_dividends=self._parse_amount(fields.get("qualified_dividends")),
                nonemployee_compensation=self._parse_amount(fields.get("nonemployee_compensation")),
                unemployment_compensation=self._parse_amount(fields.get("unemployment_compensation")),
                tax_year=data.get("tax_year"),
            )

        return ExtractedDocument(
            document_type=document_type,
            w2_data=w2_data,
            form_1099_data=form_1099_data,
            confidence_score=data.get("confidence_score", 0.0),
            notes=data.get("notes"),
        )

    @staticmethod
    def _parse_amount(value) -> Optional[float]:
        """Parse an amount string to float."""
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Remove currency symbols, commas
            cleaned = re.sub(r"[,$]", "", value.strip())
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None
