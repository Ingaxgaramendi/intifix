"""
Prometheus + structured-access-log middleware.

Wraps the whole request to measure latency, count requests/errors by
method/endpoint/status, and emit one structured JSON access log per request
(picked up by Loki). Placed at the top of the middleware stack so it observes
the full processing time, including downstream middleware.
"""
from __future__ import annotations

import logging
import time

from shared.infrastructure.observability.metrics import (
    ERROR_COUNT,
    REQUEST_COUNT,
    REQUEST_LATENCY,
    REQUESTS_IN_PROGRESS,
)

access_logger = logging.getLogger("intifix.access")


class PrometheusMiddleware:
    def __init__(self, get_response):  # noqa: ANN001
        self.get_response = get_response

    def __call__(self, request):  # noqa: ANN001
        method = request.method
        start = time.perf_counter()
        # The endpoint label is unknown until the URL resolves; track in-progress
        # against a coarse label and refine the rest after the view runs.
        in_progress = REQUESTS_IN_PROGRESS.labels(method=method, endpoint="*")
        in_progress.inc()
        status_code = 500
        try:
            response = self.get_response(request)
            status_code = response.status_code
            return response
        finally:
            duration = time.perf_counter() - start
            endpoint = self._endpoint(request)
            in_progress.dec()

            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
            REQUEST_COUNT.labels(
                method=method, endpoint=endpoint, status=str(status_code)
            ).inc()
            if status_code >= 500:
                ERROR_COUNT.labels(method=method, endpoint=endpoint).inc()

            self._log(request, endpoint, status_code, duration)

    @staticmethod
    def _endpoint(request) -> str:  # noqa: ANN001
        match = getattr(request, "resolver_match", None)
        if match is not None and getattr(match, "route", None):
            return match.route
        return "unmatched"

    @staticmethod
    def _log(request, endpoint: str, status: int, duration: float) -> None:  # noqa: ANN001
        access_logger.info(
            "%s %s %d",
            request.method,
            request.path,
            status,
            extra={
                "method": request.method,
                "path": request.path,
                "endpoint": endpoint,
                "status": status,
                "duration_ms": round(duration * 1000, 2),
            },
        )
