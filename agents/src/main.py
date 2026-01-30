"""
FastAPI server for TaxHelper AI Agents.

Exposes REST endpoints for triggering agent workflows.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from .document_ocr import DocumentOCRAgent
from .communication import CommunicationAgent
from .status_tracker import StatusTrackerAgent

app = FastAPI(
    title="TaxHelper AI Agents",
    description="AI agents for document OCR, communication, and status tracking",
    version="1.0.0",
)

# Initialize agents
ocr_agent = DocumentOCRAgent()
communication_agent = CommunicationAgent()
status_tracker = StatusTrackerAgent()


class OCRRequest(BaseModel):
    document_id: str


class CommunicationRequest(BaseModel):
    customer_id: str
    status: str
    return_id: Optional[str] = None


class StatusCheckRequest(BaseModel):
    return_id: str


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "taxhelper-agents"}


@app.post("/ocr/process")
async def process_document(request: OCRRequest, background_tasks: BackgroundTasks):
    """
    Trigger OCR processing for a document.

    Returns immediately, processing happens in background.
    """
    background_tasks.add_task(ocr_agent.process_document, request.document_id)
    return {
        "status": "processing",
        "document_id": request.document_id,
        "message": "Document OCR processing started",
    }


@app.post("/ocr/process-sync")
async def process_document_sync(request: OCRRequest):
    """
    Process a document synchronously (waits for completion).
    """
    result = await ocr_agent.process_document(request.document_id)

    if not result.success:
        raise HTTPException(status_code=500, detail=result.error_message)

    return {
        "status": "completed",
        "document_id": request.document_id,
        "document_type": result.extracted_data.document_type.value if result.extracted_data else None,
        "confidence": result.extracted_data.confidence_score if result.extracted_data else 0,
        "processing_time_ms": result.processing_time_ms,
    }


@app.post("/communication/notify")
async def send_notification(request: CommunicationRequest, background_tasks: BackgroundTasks):
    """
    Send a status change notification to a customer.
    """
    background_tasks.add_task(
        communication_agent.notify_status_change,
        request.customer_id,
        request.status,
        request.return_id,
    )
    return {
        "status": "queued",
        "customer_id": request.customer_id,
        "message": f"Notification for status '{request.status}' queued",
    }


@app.post("/status/check")
async def check_return_status(request: StatusCheckRequest):
    """
    Check and potentially update status for a tax return.
    """
    result = await status_tracker.check_return(request.return_id)

    return {
        "return_id": request.return_id,
        "current_status": result.get("current_status"),
        "new_status": result.get("new_status"),
        "status_changed": result.get("status_changed", False),
        "notification_sent": result.get("notification_sent", False),
    }


@app.get("/status/deadlines")
async def check_deadlines():
    """
    Check all returns for upcoming deadlines.
    """
    alerts = await status_tracker.check_deadlines()
    return {"alerts": alerts, "count": len(alerts)}


@app.get("/status/extensions-needed")
async def check_extensions():
    """
    Identify returns that need extensions filed.
    """
    extensions = await status_tracker.identify_extensions_needed()
    return {"extensions_needed": extensions, "count": len(extensions)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
