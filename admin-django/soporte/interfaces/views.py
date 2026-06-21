"""REST controllers for the Support/Chat context."""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.interfaces.rest.permissions import IsAdmin
from shared.interfaces.rest.utils import bearer_token

from ..infrastructure.chat_gateway import ChatGateway


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request: Request) -> Response:
        gateway = ChatGateway(bearer_token=bearer_token(request))
        return Response(gateway.list_conversations(params=request.query_params.dict()))


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request: Request, conversation_id: str) -> Response:
        gateway = ChatGateway(bearer_token=bearer_token(request))
        return Response(
            gateway.list_messages(conversation_id, params=request.query_params.dict())
        )
