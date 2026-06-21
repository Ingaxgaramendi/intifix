"""
MongoDB Atlas access (audit trail & analytics documents).

A single, lazily-created ``MongoClient`` is shared process-wide (pymongo's
client is thread-safe and manages its own connection pool). Business data lives
in the microservices; Mongo here is for append-only operational documents the
panel itself owns.
"""
from __future__ import annotations

import threading
from functools import lru_cache

from django.conf import settings
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

_lock = threading.Lock()
_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        with _lock:
            if _client is None:
                uri = settings.MONGODB["URI"]
                if not uri:
                    raise RuntimeError("MONGODB_URI is not configured.")
                _client = MongoClient(uri, appname="intifix-admin", tz_aware=True)
    return _client


def get_database() -> Database:
    return get_client()[settings.MONGODB["DB_NAME"]]


@lru_cache(maxsize=None)
def get_collection(name: str) -> Collection:
    return get_database()[name]
