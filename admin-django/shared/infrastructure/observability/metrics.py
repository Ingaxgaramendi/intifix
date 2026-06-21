"""
Prometheus metric definitions for Intifix Admin.

These are the application-level RED metrics (Rate, Errors, Duration). Process
CPU / memory are exported automatically by ``prometheus_client``'s default
``ProcessCollector`` (``process_cpu_seconds_total``,
``process_resident_memory_bytes``, ...) when running on Linux containers — no
extra code needed.

Label cardinality is kept bounded by using the matched URL *route* (e.g.
``api/admin/users/<str:user_id>/ban/``) as the ``endpoint`` label rather than
the concrete path, so per-id explosion never happens.
"""
from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram

REQUEST_COUNT = Counter(
    "intifix_http_requests_total",
    "Total HTTP requests processed.",
    ["method", "endpoint", "status"],
)

ERROR_COUNT = Counter(
    "intifix_http_errors_total",
    "Total HTTP responses with a 5xx status.",
    ["method", "endpoint"],
)

REQUEST_LATENCY = Histogram(
    "intifix_http_request_duration_seconds",
    "HTTP request latency in seconds.",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

REQUESTS_IN_PROGRESS = Gauge(
    "intifix_http_requests_in_progress",
    "Number of HTTP requests currently being processed.",
    ["method", "endpoint"],
    multiprocess_mode="livesum",
)
