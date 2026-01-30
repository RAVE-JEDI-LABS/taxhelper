import asyncio
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from ..shared.api_client import APIClient
from ..shared.config import settings
from ..models.communications import (
    CommunicationType,
    CommunicationMessage,
    DEFAULT_TEMPLATES,
)


class CommunicationState(TypedDict):
    """State for the communication agent workflow."""

    customer_id: str
    return_id: Optional[str]
    status: str
    customer_data: Optional[dict]
    return_data: Optional[dict]
    message: Optional[CommunicationMessage]
    sent: bool
    error: Optional[str]


class CommunicationAgent:
    """
    AI agent for automated client communications.

    This agent:
    1. Triggers on tax return status changes
    2. Fetches customer and return information
    3. Generates personalized messages using GPT-4
    4. Sends communications via email or SMS

    Supports custom templates and AI-generated content.
    """

    def __init__(self, api_client: Optional[APIClient] = None):
        self.api_client = api_client or APIClient()
        self.llm = ChatOpenAI(
            model=settings.communication_model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for communication."""
        workflow = StateGraph(CommunicationState)

        workflow.add_node("fetch_data", self._fetch_data)
        workflow.add_node("generate_message", self._generate_message)
        workflow.add_node("send_message", self._send_message)
        workflow.add_node("handle_error", self._handle_error)

        workflow.set_entry_point("fetch_data")
        workflow.add_conditional_edges(
            "fetch_data",
            lambda s: "generate_message" if not s.get("error") else "handle_error",
        )
        workflow.add_conditional_edges(
            "generate_message",
            lambda s: "send_message" if not s.get("error") else "handle_error",
        )
        workflow.add_edge("send_message", END)
        workflow.add_edge("handle_error", END)

        return workflow.compile()

    async def notify_status_change(
        self,
        customer_id: str,
        new_status: str,
        return_id: Optional[str] = None,
    ) -> bool:
        """
        Send notification for a status change.

        Args:
            customer_id: Customer to notify
            new_status: New return status
            return_id: Optional tax return ID

        Returns:
            True if message was sent successfully
        """
        initial_state: CommunicationState = {
            "customer_id": customer_id,
            "return_id": return_id,
            "status": new_status,
            "customer_data": None,
            "return_data": None,
            "message": None,
            "sent": False,
            "error": None,
        }

        final_state = await self.workflow.ainvoke(initial_state)
        return final_state.get("sent", False)

    async def _fetch_data(self, state: CommunicationState) -> CommunicationState:
        """Fetch customer and return data."""
        try:
            # Fetch customer
            customer = await self.api_client.get_customer(state["customer_id"])
            state["customer_data"] = customer

            # Fetch return if provided
            if state["return_id"]:
                tax_return = await self.api_client.get_return(state["return_id"])
                state["return_data"] = tax_return

        except Exception as e:
            state["error"] = f"Failed to fetch data: {e}"
        return state

    async def _generate_message(self, state: CommunicationState) -> CommunicationState:
        """Generate the communication message."""
        try:
            customer = state["customer_data"]
            tax_return = state["return_data"] or {}
            status = state["status"]

            customer_name = f"{customer.get('firstName', '')} {customer.get('lastName', '')}".strip()
            tax_year = tax_return.get("taxYear", "2024")

            # Check for template
            template = DEFAULT_TEMPLATES.get(status)

            if template:
                # Use template
                subject, body = template.render(
                    customer_name=customer_name,
                    tax_year=tax_year,
                    missing_items="- Please check with our office",
                    refund_info="Please check your return documents for refund details.",
                )
            else:
                # Generate with AI
                subject, body = await self._generate_ai_message(
                    customer_name=customer_name,
                    status=status,
                    tax_year=tax_year,
                    additional_context=tax_return.get("routingSheet", {}).get("notes", ""),
                )

            state["message"] = CommunicationMessage(
                customer_id=state["customer_id"],
                comm_type=CommunicationType.EMAIL,
                subject=subject,
                content=body,
                customer_name=customer_name,
                customer_email=customer.get("email"),
            )

        except Exception as e:
            state["error"] = f"Failed to generate message: {e}"
        return state

    async def _generate_ai_message(
        self,
        customer_name: str,
        status: str,
        tax_year: str,
        additional_context: str = "",
    ) -> tuple[str, str]:
        """Generate a message using AI."""
        system_prompt = """You are a professional assistant for Gordon Ulen CPA, a tax preparation firm.
Generate friendly, professional email communications for tax clients.
Keep messages concise but warm. Include relevant details about their tax return status.
Always sign off with "Best regards, Gordon Ulen CPA Team"."""

        user_prompt = f"""Generate an email for {customer_name} about their {tax_year} tax return.
Status: {status.replace('_', ' ').title()}
Additional context: {additional_context or 'None'}

Provide the email subject and body. Format:
Subject: [subject line]
Body:
[email body]"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]

        response = await self.llm.ainvoke(messages)
        text = response.content

        # Parse response
        lines = text.strip().split("\n")
        subject = ""
        body_lines = []
        in_body = False

        for line in lines:
            if line.lower().startswith("subject:"):
                subject = line[8:].strip()
            elif line.lower().startswith("body:"):
                in_body = True
            elif in_body:
                body_lines.append(line)

        body = "\n".join(body_lines).strip()

        return subject or f"Update on Your {tax_year} Tax Return", body

    async def _send_message(self, state: CommunicationState) -> CommunicationState:
        """Send the communication via API."""
        try:
            message = state["message"]
            if not message:
                state["error"] = "No message to send"
                return state

            await self.api_client.send_communication(
                customer_id=message.customer_id,
                comm_type=message.comm_type.value,
                content=message.content,
                subject=message.subject,
                triggered_by="agent",
            )

            state["sent"] = True
            print(f"[Communication] Sent {message.comm_type.value} to {message.customer_email}")

        except Exception as e:
            state["error"] = f"Failed to send message: {e}"
        return state

    async def _handle_error(self, state: CommunicationState) -> CommunicationState:
        """Handle errors in the workflow."""
        print(f"[Communication Error] {state.get('error')}")
        return state


# CLI entry point
async def main():
    import sys

    if len(sys.argv) < 3:
        print("Usage: python -m src.communication.agent <customer_id> <status>")
        sys.exit(1)

    customer_id = sys.argv[1]
    status = sys.argv[2]
    return_id = sys.argv[3] if len(sys.argv) > 3 else None

    agent = CommunicationAgent()
    success = await agent.notify_status_change(customer_id, status, return_id)
    print(f"Communication sent: {success}")


if __name__ == "__main__":
    asyncio.run(main())
