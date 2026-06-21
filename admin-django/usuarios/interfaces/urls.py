from django.urls import path

from .views import (
    ActivateUserView,
    BanUserView,
    SuspendUserView,
    UserDetailView,
    UserListView,
)

app_name = "usuarios"

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("<str:user_id>/", UserDetailView.as_view(), name="user-detail"),
    path("<str:user_id>/suspend/", SuspendUserView.as_view(), name="user-suspend"),
    path("<str:user_id>/activate/", ActivateUserView.as_view(), name="user-activate"),
    path("<str:user_id>/ban/", BanUserView.as_view(), name="user-ban"),
]
