"""Anti-Corruption Layer gateway to the Chat Service (support conversations)."""
from __future__ import annotations

from shared.infrastructure.http.base_gateway import BaseGateway


class ChatGateway(BaseGateway):
    service_name = "chat"

    def list_conversations(self, *, params: dict | None = None):
        return self.get("/api/v1/chat/conversaciones", params=params)

    def get_conversation(self, conversation_id: str):
        return self.get(f"/api/v1/chat/conversaciones/{conversation_id}")

    def list_messages(self, conversation_id: str, *, params: dict | None = None):
        return self.get(
            f"/api/v1/chat/mensajes/conversacion/{conversation_id}", params=params
        )
