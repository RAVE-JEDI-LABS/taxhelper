import httpx
from typing import Any, Optional
from .config import settings


class APIClient:
    """HTTP client for communicating with the TaxHelper backend API."""

    def __init__(self, base_url: Optional[str] = None, token: Optional[str] = None):
        self.base_url = base_url or settings.api_base_url
        self.token = token or settings.api_token
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            headers = {"Content-Type": "application/json"}
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=30.0,
            )
        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def get(self, endpoint: str, params: Optional[dict] = None) -> dict:
        client = await self._get_client()
        response = await client.get(endpoint, params=params)
        response.raise_for_status()
        return response.json()

    async def post(self, endpoint: str, data: Optional[dict] = None) -> dict:
        client = await self._get_client()
        response = await client.post(endpoint, json=data)
        response.raise_for_status()
        return response.json()

    async def patch(self, endpoint: str, data: Optional[dict] = None) -> dict:
        client = await self._get_client()
        response = await client.patch(endpoint, json=data)
        response.raise_for_status()
        return response.json()

    async def delete(self, endpoint: str) -> None:
        client = await self._get_client()
        response = await client.delete(endpoint)
        response.raise_for_status()

    # Document-specific methods
    async def get_document(self, doc_id: str) -> dict:
        return await self.get(f"/api/documents/{doc_id}")

    async def update_document(self, doc_id: str, data: dict) -> dict:
        return await self.patch(f"/api/documents/{doc_id}", data)

    # Customer methods
    async def get_customer(self, customer_id: str) -> dict:
        return await self.get(f"/api/customers/{customer_id}")

    # Return methods
    async def get_return(self, return_id: str) -> dict:
        return await self.get(f"/api/returns/{return_id}")

    async def update_return_status(self, return_id: str, status: str, notes: str = "") -> dict:
        return await self.patch(f"/api/returns/{return_id}/status", {"status": status, "notes": notes})

    # Communication methods
    async def send_communication(
        self,
        customer_id: str,
        comm_type: str,
        content: str,
        subject: Optional[str] = None,
        triggered_by: str = "agent",
    ) -> dict:
        data = {
            "customerId": customer_id,
            "type": comm_type,
            "content": content,
            "triggeredBy": triggered_by,
        }
        if subject:
            data["subject"] = subject
        return await self.post("/api/communications/send", data)
