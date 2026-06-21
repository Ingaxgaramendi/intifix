"""DRF serializers for the Moderation context — output shaping + input validation."""
from __future__ import annotations

from rest_framework import serializers

from ..domain.entities import ReportStatus


class ReportSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    reason = serializers.CharField(read_only=True)
    status = serializers.ChoiceField(choices=[s.value for s in ReportStatus], read_only=True)
    reported_user_id = serializers.CharField(read_only=True, allow_null=True)
    service_id = serializers.CharField(read_only=True, allow_null=True)
    reporter_id = serializers.CharField(read_only=True, allow_null=True)
    description = serializers.CharField(read_only=True, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True, allow_null=True)


class ReportListQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(
        required=False, min_value=1, max_value=200, default=25
    )
    status = serializers.ChoiceField(
        choices=[s.value for s in ReportStatus], required=False, allow_blank=True
    )
    search = serializers.CharField(required=False, allow_blank=True, max_length=200)


class CommentSerializer(serializers.Serializer):
    report_id = serializers.CharField(read_only=True)
    author_id = serializers.CharField(read_only=True)
    body = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True, allow_null=True)


class AddCommentSerializer(serializers.Serializer):
    body = serializers.CharField(required=True, allow_blank=False, max_length=2000)


class HistoryEntrySerializer(serializers.Serializer):
    report_id = serializers.CharField(read_only=True)
    actor_id = serializers.CharField(read_only=True)
    action = serializers.CharField(read_only=True)
    from_status = serializers.CharField(read_only=True, allow_null=True)
    to_status = serializers.CharField(read_only=True, allow_null=True)
    note = serializers.CharField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True, allow_null=True)


class ReportActionSerializer(serializers.Serializer):
    """Optional moderator note for review / resolve."""

    note = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class BlockUserSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
    report_id = serializers.CharField(required=False, allow_blank=True, max_length=64)


class UnblockUserSerializer(serializers.Serializer):
    report_id = serializers.CharField(required=False, allow_blank=True, max_length=64)
