"""
Thin caching helper over Django's Redis cache backend.

Gateways use this to cache slow, rarely-changing upstream reads (e.g. service
catalogs) so the panel stays responsive even when a microservice is sluggish.
The backend is configured with IGNORE_EXCEPTIONS=True, so a Redis outage
degrades gracefully instead of breaking requests.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any, TypeVar

from django.conf import settings
from django.core.cache import cache

T = TypeVar("T")


def get_or_set(key: str, producer: Callable[[], T], *, ttl: int | None = None) -> T:
    """Return the cached value for ``key`` or compute, store and return it."""
    cached = cache.get(key)
    if cached is not None:
        return cached
    value = producer()
    cache.set(key, value, timeout=ttl or settings.REDIS_CACHE_TTL)
    return value


def invalidate(*keys: str) -> None:
    cache.delete_many(list(keys))


def build_key(*parts: Any) -> str:
    return ":".join(str(p) for p in parts)
