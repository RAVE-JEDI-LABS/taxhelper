import asyncio
from datetime import datetime, timedelta
from typing import Optional, List

from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from ..shared.api_client import APIClient
from ..communication import CommunicationAgent


class TrackerState(TypedDict):
    """State for the status tracker workflow."""

    tax_return_id: str
    return_data: Optional[dict]
    documents: List[dict]
    current_status: str
    recommended_status: Optional[str]
    status_changed: bool
    notification_sent: bool
    error: Optional[str]


class StatusTrackerAgent:
    """
    AI agent for tracking and updating tax return statuses.

    This agent:
    1. Monitors document uploads and return status
    2. Automatically updates status based on document completeness
    3. Identifies extensions needed
    4. Triggers communication when status changes
    5. Monitors deadlines and flags overdue items
    """

    # Document requirements by return type
    REQUIRED_DOCUMENTS = {
        "1040": ["w2"],  # At minimum need W-2 for most returns
        "1120": ["k1"],
        "1120s": ["k1"],
        "1065": ["k1"],
        "990": [],
    }

    def __init__(
        self,
        api_client: Optional[APIClient] = None,
        communication_agent: Optional[CommunicationAgent] = None,
    ):
        self.api_client = api_client or APIClient()
        self.communication_agent = communication_agent or CommunicationAgent(self.api_client)
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the status tracking workflow."""
        workflow = StateGraph(TrackerState)

        workflow.add_node("fetch_return", self._fetch_return)
        workflow.add_node("fetch_documents", self._fetch_documents)
        workflow.add_node("analyze_status", self._analyze_status)
        workflow.add_node("update_status", self._update_status)
        workflow.add_node("send_notification", self._send_notification)

        workflow.set_entry_point("fetch_return")
        workflow.add_edge("fetch_return", "fetch_documents")
        workflow.add_edge("fetch_documents", "analyze_status")
        workflow.add_conditional_edges(
            "analyze_status",
            lambda s: "update_status" if s.get("recommended_status") else END,
        )
        workflow.add_conditional_edges(
            "update_status",
            lambda s: "send_notification" if s.get("status_changed") else END,
        )
        workflow.add_edge("send_notification", END)

        return workflow.compile()

    async def check_return(self, return_id: str) -> dict:
        """
        Check and update status for a tax return.

        Args:
            return_id: Tax return ID to check

        Returns:
            Dict with status check results
        """
        initial_state: TrackerState = {
            "tax_return_id": return_id,
            "return_data": None,
            "documents": [],
            "current_status": "",
            "recommended_status": None,
            "status_changed": False,
            "notification_sent": False,
            "error": None,
        }

        final_state = await self.workflow.ainvoke(initial_state)

        return {
            "return_id": return_id,
            "current_status": final_state.get("current_status"),
            "new_status": final_state.get("recommended_status"),
            "status_changed": final_state.get("status_changed", False),
            "notification_sent": final_state.get("notification_sent", False),
            "error": final_state.get("error"),
        }

    async def check_deadlines(self) -> List[dict]:
        """Check all returns for upcoming deadlines."""
        alerts = []

        try:
            # Get all active returns
            result = await self.api_client.get("/api/returns", params={"limit": 100})
            returns = result.get("data", [])

            today = datetime.now()
            warning_threshold = today + timedelta(days=14)

            for tax_return in returns:
                if tax_return.get("status") in ["completed", "filed", "picked_up"]:
                    continue

                due_date_str = tax_return.get("dueDate")
                if not due_date_str:
                    continue

                due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))

                if due_date < today:
                    alerts.append({
                        "return_id": tax_return["id"],
                        "customer_id": tax_return["customerId"],
                        "alert_type": "overdue",
                        "due_date": due_date_str,
                        "days_overdue": (today - due_date).days,
                    })
                elif due_date < warning_threshold:
                    alerts.append({
                        "return_id": tax_return["id"],
                        "customer_id": tax_return["customerId"],
                        "alert_type": "upcoming",
                        "due_date": due_date_str,
                        "days_until_due": (due_date - today).days,
                    })

        except Exception as e:
            print(f"Error checking deadlines: {e}")

        return alerts

    async def identify_extensions_needed(self) -> List[dict]:
        """Identify returns that need extensions filed."""
        extensions_needed = []

        try:
            result = await self.api_client.get("/api/returns", params={"limit": 100})
            returns = result.get("data", [])

            today = datetime.now()
            # Extension cutoff - 7 days before due date
            extension_threshold = timedelta(days=7)

            for tax_return in returns:
                # Skip if already filed or extension already filed
                if tax_return.get("status") in ["completed", "filed", "picked_up", "extension_filed"]:
                    continue
                if tax_return.get("extensionFiled"):
                    continue

                due_date_str = tax_return.get("dueDate")
                if not due_date_str:
                    continue

                due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))

                # If due date is within threshold and status is early stage
                if due_date - today < extension_threshold:
                    if tax_return.get("status") in [
                        "intake",
                        "documents_pending",
                        "documents_complete",
                        "in_preparation",
                    ]:
                        extensions_needed.append({
                            "return_id": tax_return["id"],
                            "customer_id": tax_return["customerId"],
                            "tax_year": tax_return["taxYear"],
                            "return_type": tax_return["returnType"],
                            "due_date": due_date_str,
                            "current_status": tax_return["status"],
                        })

        except Exception as e:
            print(f"Error identifying extensions: {e}")

        return extensions_needed

    async def _fetch_return(self, state: TrackerState) -> TrackerState:
        """Fetch tax return data."""
        try:
            tax_return = await self.api_client.get_return(state["tax_return_id"])
            state["return_data"] = tax_return
            state["current_status"] = tax_return.get("status", "")
        except Exception as e:
            state["error"] = f"Failed to fetch return: {e}"
        return state

    async def _fetch_documents(self, state: TrackerState) -> TrackerState:
        """Fetch documents for the return."""
        try:
            if not state["return_data"]:
                return state

            customer_id = state["return_data"].get("customerId")
            tax_year = state["return_data"].get("taxYear")

            result = await self.api_client.get(
                "/api/documents",
                params={"customerId": customer_id, "taxYear": tax_year},
            )
            state["documents"] = result.get("data", [])

        except Exception as e:
            state["error"] = f"Failed to fetch documents: {e}"
        return state

    async def _analyze_status(self, state: TrackerState) -> TrackerState:
        """Analyze and recommend status updates."""
        if not state["return_data"]:
            return state

        current_status = state["current_status"]
        return_type = state["return_data"].get("returnType", "1040")
        documents = state["documents"]

        # Get document types present
        doc_types = {doc.get("type") for doc in documents if doc.get("status") in ["processed", "verified"]}

        # Check required documents
        required = set(self.REQUIRED_DOCUMENTS.get(return_type, []))
        has_required = required.issubset(doc_types) if required else len(doc_types) > 0

        # Determine recommended status
        recommended = None

        if current_status == "intake":
            if len(documents) > 0:
                recommended = "documents_pending"

        elif current_status == "documents_pending":
            if has_required:
                recommended = "documents_complete"

        # Don't auto-advance beyond documents_complete
        # Those require manual preparer action

        state["recommended_status"] = recommended
        return state

    async def _update_status(self, state: TrackerState) -> TrackerState:
        """Update the return status."""
        if not state["recommended_status"]:
            return state

        try:
            await self.api_client.update_return_status(
                state["tax_return_id"],
                state["recommended_status"],
                notes="Status updated automatically by status tracker agent",
            )
            state["status_changed"] = True
            print(f"[StatusTracker] Updated {state['tax_return_id']}: {state['current_status']} -> {state['recommended_status']}")

        except Exception as e:
            state["error"] = f"Failed to update status: {e}"
        return state

    async def _send_notification(self, state: TrackerState) -> TrackerState:
        """Send notification about status change."""
        if not state["status_changed"] or not state["return_data"]:
            return state

        try:
            customer_id = state["return_data"].get("customerId")
            await self.communication_agent.notify_status_change(
                customer_id=customer_id,
                new_status=state["recommended_status"],
                return_id=state["tax_return_id"],
            )
            state["notification_sent"] = True

        except Exception as e:
            print(f"Warning: Failed to send notification: {e}")

        return state


# CLI entry point
async def main():
    import sys

    agent = StatusTrackerAgent()

    if len(sys.argv) > 1:
        return_id = sys.argv[1]
        result = await agent.check_return(return_id)
        print(f"Status check result: {result}")
    else:
        # Check deadlines
        print("Checking deadlines...")
        alerts = await agent.check_deadlines()
        for alert in alerts:
            print(f"  {alert['alert_type']}: Return {alert['return_id']}")

        # Check extensions
        print("\nChecking extensions needed...")
        extensions = await agent.identify_extensions_needed()
        for ext in extensions:
            print(f"  Extension needed: Return {ext['return_id']} ({ext['return_type']})")


if __name__ == "__main__":
    asyncio.run(main())
