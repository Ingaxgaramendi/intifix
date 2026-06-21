"""
``/metrics`` endpoint exposing the Prometheus exposition format.

Plain Django view (no DRF auth/throttle) — Prometheus scrapes it over the
internal network. When running under gunicorn with multiple workers,
``PROMETHEUS_MULTIPROC_DIR`` is set and the metrics from every worker are
aggregated via the multiprocess collector so a scrape reflects the whole
process group, not a single worker.
"""
from __future__ import annotations

import os

from django.http import HttpResponse
from prometheus_client import CONTENT_TYPE_LATEST, REGISTRY, generate_latest


def metrics_view(request):  # noqa: ANN001
    multiproc_dir = os.environ.get("PROMETHEUS_MULTIPROC_DIR")
    if multiproc_dir:
        from prometheus_client import CollectorRegistry, multiprocess

        registry = CollectorRegistry()
        multiprocess.MultiProcessCollector(registry)
    else:
        registry = REGISTRY

    return HttpResponse(generate_latest(registry), content_type=CONTENT_TYPE_LATEST)
