import asyncio
import time
from typing import Optional

from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from ..shared.api_client import APIClient
from ..models.documents import DocumentExtractionResult, DocumentType
from .extractor import DocumentExtractor


class OCRState(TypedDict):
    """State for the OCR agent workflow."""

    document_id: str
    customer_id: str
    file_url: str
    hint_type: Optional[str]
    image_data: Optional[bytes]
    extraction_result: Optional[DocumentExtractionResult]
    error: Optional[str]


class DocumentOCRAgent:
    """
    AI agent for processing tax documents using OCR.

    REPLACES GRUNTWORX - Saves $0.45 per page in scanning costs.

    This agent:
    1. Fetches document metadata from the API
    2. Downloads the document file
    3. Extracts data using Claude Vision (W-2, 1099, K-1, etc.)
    4. Updates the document record with extracted data
    5. Data can then be entered into Drake tax software

    Cost comparison:
    - GruntWorx: $0.45/page = $450 for 1,000 pages
    - Tax Helper OCR: Flat API cost, typically <$50 for same volume
    """

    def __init__(self, api_client: Optional[APIClient] = None):
        self.api_client = api_client or APIClient()
        self.extractor = DocumentExtractor()
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for document processing."""
        workflow = StateGraph(OCRState)

        # Add nodes
        workflow.add_node("fetch_document", self._fetch_document)
        workflow.add_node("download_file", self._download_file)
        workflow.add_node("extract_data", self._extract_data)
        workflow.add_node("update_document", self._update_document)
        workflow.add_node("handle_error", self._handle_error)

        # Add edges
        workflow.set_entry_point("fetch_document")
        workflow.add_conditional_edges(
            "fetch_document",
            lambda s: "download_file" if not s.get("error") else "handle_error",
        )
        workflow.add_conditional_edges(
            "download_file",
            lambda s: "extract_data" if not s.get("error") else "handle_error",
        )
        workflow.add_conditional_edges(
            "extract_data",
            lambda s: "update_document" if not s.get("error") else "handle_error",
        )
        workflow.add_edge("update_document", END)
        workflow.add_edge("handle_error", END)

        return workflow.compile()

    async def process_document(self, document_id: str) -> DocumentExtractionResult:
        """
        Process a document through the OCR pipeline.

        Args:
            document_id: ID of the document to process

        Returns:
            DocumentExtractionResult with extracted data or error info
        """
        start_time = time.time()

        initial_state: OCRState = {
            "document_id": document_id,
            "customer_id": "",
            "file_url": "",
            "hint_type": None,
            "image_data": None,
            "extraction_result": None,
            "error": None,
        }

        try:
            final_state = await self.workflow.ainvoke(initial_state)

            if final_state.get("error"):
                return DocumentExtractionResult(
                    document_id=document_id,
                    customer_id=final_state.get("customer_id", ""),
                    success=False,
                    error_message=final_state["error"],
                    processing_time_ms=int((time.time() - start_time) * 1000),
                )

            return final_state["extraction_result"]

        except Exception as e:
            return DocumentExtractionResult(
                document_id=document_id,
                customer_id="",
                success=False,
                error_message=str(e),
                processing_time_ms=int((time.time() - start_time) * 1000),
            )

    async def _fetch_document(self, state: OCRState) -> OCRState:
        """Fetch document metadata from the API."""
        try:
            doc = await self.api_client.get_document(state["document_id"])
            state["customer_id"] = doc.get("customerId", "")
            state["file_url"] = doc.get("fileUrl", "")
            state["hint_type"] = doc.get("type")
        except Exception as e:
            state["error"] = f"Failed to fetch document: {e}"
        return state

    async def _download_file(self, state: OCRState) -> OCRState:
        """Download the document file."""
        try:
            import httpx

            file_url = state["file_url"]

            # Handle local/demo files
            if file_url.startswith("local://"):
                state["error"] = "Local files not yet supported - please use Firebase Storage"
                return state

            async with httpx.AsyncClient() as client:
                response = await client.get(file_url)
                response.raise_for_status()
                state["image_data"] = response.content

        except Exception as e:
            state["error"] = f"Failed to download file: {e}"
        return state

    async def _extract_data(self, state: OCRState) -> OCRState:
        """Extract data from the document using Claude Vision."""
        try:
            start_time = time.time()

            # Determine media type from file extension
            file_url = state["file_url"].lower()
            if file_url.endswith(".pdf"):
                media_type = "application/pdf"
            elif file_url.endswith(".png"):
                media_type = "image/png"
            else:
                media_type = "image/jpeg"

            # Get hint type
            hint_type = None
            if state["hint_type"]:
                hint_type = DocumentType(state["hint_type"])

            # Extract data
            extracted = await self.extractor.extract_from_image(
                state["image_data"],
                media_type=media_type,
                hint_document_type=hint_type,
            )

            state["extraction_result"] = DocumentExtractionResult(
                document_id=state["document_id"],
                customer_id=state["customer_id"],
                success=True,
                extracted_data=extracted,
                processing_time_ms=int((time.time() - start_time) * 1000),
            )

        except Exception as e:
            state["error"] = f"Failed to extract data: {e}"
        return state

    async def _update_document(self, state: OCRState) -> OCRState:
        """Update the document record with extracted data."""
        try:
            result = state["extraction_result"]
            if result and result.extracted_data:
                await self.api_client.update_document(
                    state["document_id"],
                    {
                        "ocrExtracted": True,
                        "extractedData": result.extracted_data.model_dump(),
                        "status": "processed",
                        "type": result.extracted_data.document_type.value,
                    },
                )
        except Exception as e:
            # Don't fail the whole process if update fails
            print(f"Warning: Failed to update document: {e}")
        return state

    async def _handle_error(self, state: OCRState) -> OCRState:
        """Handle errors in the workflow."""
        try:
            await self.api_client.update_document(
                state["document_id"],
                {
                    "ocrExtracted": False,
                    "status": "pending",
                    "extractedData": {"error": state["error"]},
                },
            )
        except Exception:
            pass  # Ignore update errors in error handler
        return state


# CLI entry point for testing
async def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m src.document_ocr.agent <document_id>")
        sys.exit(1)

    document_id = sys.argv[1]
    agent = DocumentOCRAgent()

    print(f"Processing document: {document_id}")
    result = await agent.process_document(document_id)

    print(f"Success: {result.success}")
    if result.success and result.extracted_data:
        print(f"Document type: {result.extracted_data.document_type}")
        print(f"Confidence: {result.extracted_data.confidence_score}")
    else:
        print(f"Error: {result.error_message}")


if __name__ == "__main__":
    asyncio.run(main())
