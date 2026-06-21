"""DRF serializers for reading the audit trail."""
from __future__ import annotations

from rest_framework import serializers


class AuditLogQuerySerializer(serializers.Serializer):
    """Validates the audit-log read filters."""

    admin_id = serializers.CharField(required=False, allow_blank=True, max_length=64)
    accion = serializers.CharField(required=False, allow_blank=True, max_length=64)
    modulo = serializers.CharField(required=False, allow_blank=True, max_length=64)
    entidad = serializers.CharField(required=False, allow_blank=True, max_length=64)
    entidad_id = serializers.CharField(required=False, allow_blank=True, max_length=64)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=500, default=50)
    skip = serializers.IntegerField(required=False, min_value=0, default=0)


class AuditLogSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    admin_id = serializers.CharField(read_only=True)
    accion = serializers.CharField(read_only=True)
    modulo = serializers.CharField(read_only=True)
    entidad = serializers.CharField(read_only=True, allow_null=True)
    entidad_id = serializers.CharField(read_only=True, allow_null=True)
    ip = serializers.CharField(read_only=True, allow_null=True)
    user_agent = serializers.CharField(read_only=True, allow_null=True)
    metadata = serializers.DictField(read_only=True)
    fecha = serializers.DateTimeField(read_only=True)
