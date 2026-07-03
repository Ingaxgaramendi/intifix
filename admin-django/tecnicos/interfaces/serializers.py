"""DRF serializers for the Technicians context — output shaping + input validation."""
from __future__ import annotations

from rest_framework import serializers

from ..domain.entities import DocumentType, TechnicianStatus


class TechnicianSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    status = serializers.ChoiceField(
        choices=[s.value for s in TechnicianStatus], read_only=True
    )
    specialties = serializers.ListField(child=serializers.CharField(), read_only=True)
    phone = serializers.CharField(read_only=True, allow_null=True)
    rating = serializers.FloatField(read_only=True, allow_null=True)
    documents_complete = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True, allow_null=True)


class TechnicianDocumentSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=[d.value for d in DocumentType], read_only=True)
    url = serializers.URLField(read_only=True)
    verified = serializers.BooleanField(read_only=True)
    uploaded_at = serializers.DateTimeField(read_only=True, allow_null=True)
    label = serializers.CharField(read_only=True, allow_null=True)


class TechnicianListQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(
        required=False, min_value=1, max_value=200, default=25
    )
    search = serializers.CharField(required=False, allow_blank=True, max_length=200)
    status = serializers.ChoiceField(
        choices=[s.value for s in TechnicianStatus], required=False, allow_blank=True
    )


class ModerationActionSerializer(serializers.Serializer):
    """Optional audit reason for approve / suspend."""

    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)


class RejectActionSerializer(serializers.Serializer):
    """Rejection requires a reason (recorded in the audit trail)."""

    reason = serializers.CharField(required=True, allow_blank=False, max_length=500)
