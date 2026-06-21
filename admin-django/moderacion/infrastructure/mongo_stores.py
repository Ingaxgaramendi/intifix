"""
MongoDB-backed stores for the panel's own moderation artifacts.

Internal comments and the moderation history are append-only operational
documents owned by the admin panel (not business entities), so they live in the
panel's own MongoDB database — the same pattern as the shared audit trail. No
Django ORM, no business migrations.
"""
from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone

from shared.infrastructure.mongo.client import get_collection

from ..domain.entities import HistoryEntry, InternalComment
from ..domain.ports import CommentStore, HistoryStore

_COMMENTS = "moderation_comments"
_HISTORY = "moderation_history"


class MongoCommentStore(CommentStore):
    def __init__(self) -> None:
        self._collection = get_collection(_COMMENTS)

    def add(self, comment: InternalComment) -> InternalComment:
        created = datetime.now(timezone.utc)
        document = asdict(comment)
        document["created_at"] = created
        self._collection.insert_one(document)
        return InternalComment(
            report_id=comment.report_id,
            author_id=comment.author_id,
            body=comment.body,
            created_at=created,
        )

    def list(self, report_id: str) -> list[InternalComment]:
        cursor = (
            self._collection.find({"report_id": report_id}, {"_id": False})
            .sort("created_at", 1)
        )
        return [
            InternalComment(
                report_id=doc["report_id"],
                author_id=doc.get("author_id", ""),
                body=doc.get("body", ""),
                created_at=doc.get("created_at"),
            )
            for doc in cursor
        ]


class MongoHistoryStore(HistoryStore):
    def __init__(self) -> None:
        self._collection = get_collection(_HISTORY)

    def append(self, entry: HistoryEntry) -> None:
        document = asdict(entry)
        document["created_at"] = datetime.now(timezone.utc)
        self._collection.insert_one(document)

    def list(self, report_id: str) -> list[HistoryEntry]:
        cursor = (
            self._collection.find({"report_id": report_id}, {"_id": False})
            .sort("created_at", 1)
        )
        return [
            HistoryEntry(
                report_id=doc["report_id"],
                actor_id=doc.get("actor_id", ""),
                action=doc.get("action", ""),
                from_status=doc.get("from_status"),
                to_status=doc.get("to_status"),
                note=doc.get("note"),
                created_at=doc.get("created_at"),
            )
            for doc in cursor
        ]
