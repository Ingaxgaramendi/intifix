from django.urls import path

from .views import ConversationListView, ConversationMessagesView

app_name = "soporte"

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path(
        "conversations/<str:conversation_id>/messages/",
        ConversationMessagesView.as_view(),
        name="conversation-messages",
    ),
]
