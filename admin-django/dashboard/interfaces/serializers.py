"""DRF serializers — translate dashboard domain entities to the wire (presentation only)."""
from __future__ import annotations

from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    """The nine real-time platform counters."""

    registered_users = serializers.IntegerField(read_only=True)
    approved_technicians = serializers.IntegerField(read_only=True)
    pending_technicians = serializers.IntegerField(read_only=True)
    active_services = serializers.IntegerField(read_only=True)
    completed_services = serializers.IntegerField(read_only=True)
    completed_payments = serializers.IntegerField(read_only=True)
    total_revenue = serializers.FloatField(read_only=True)
    open_reports = serializers.IntegerField(read_only=True)
    active_conversations = serializers.IntegerField(read_only=True)


class ChartPointSerializer(serializers.Serializer):
    label = serializers.CharField(read_only=True)
    value = serializers.FloatField(read_only=True)


class ChartSeriesSerializer(serializers.Serializer):
    key = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    type = serializers.CharField(read_only=True)
    points = ChartPointSerializer(many=True, read_only=True)


class KpiSerializer(serializers.Serializer):
    key = serializers.CharField(read_only=True)
    label = serializers.CharField(read_only=True)
    value = serializers.FloatField(read_only=True)
    unit = serializers.CharField(read_only=True, allow_blank=True)
    trend = serializers.FloatField(read_only=True, allow_null=True)
