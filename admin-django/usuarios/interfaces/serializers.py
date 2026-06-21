"""DRF serializers — translate DTOs to/from the wire and validate input (presentation only)."""
from __future__ import annotations

from rest_framework import serializers

from ..domain.entities import UserRole, UserStatus


class UserSerializer(serializers.Serializer):
    """Output shape of a ``UserDTO``."""

    id = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    status = serializers.ChoiceField(choices=[s.value for s in UserStatus], read_only=True)
    role = serializers.ChoiceField(choices=[r.value for r in UserRole], read_only=True)
    phone = serializers.CharField(read_only=True, allow_null=True)
    is_verified = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True, allow_null=True)


class UserListQuerySerializer(serializers.Serializer):
    """Validates and normalizes the list endpoint's query parameters."""

    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(
        required=False, min_value=1, max_value=200, default=25
    )
    search = serializers.CharField(required=False, allow_blank=True, max_length=200)
    status = serializers.ChoiceField(
        choices=[s.value for s in UserStatus], required=False, allow_blank=True
    )
    role = serializers.ChoiceField(
        choices=[r.value for r in UserRole], required=False, allow_blank=True
    )


class StatusActionSerializer(serializers.Serializer):
    """Optional body for suspend/activate/ban — an audit reason."""

    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
