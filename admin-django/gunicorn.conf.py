"""
Gunicorn configuration.

Enables prometheus_client *multiprocess* mode so the ``/metrics`` endpoint
aggregates counters/histograms across all gunicorn workers. Requires
``PROMETHEUS_MULTIPROC_DIR`` to point at a writable, empty directory (set in the
Dockerfile / compose). The ``child_exit`` hook marks a dead worker so its
samples stop being double-counted.
"""
from __future__ import annotations

import os

bind = "0.0.0.0:8000"
workers = int(os.environ.get("GUNICORN_WORKERS", "3"))
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "60"))
accesslog = "-"
errorlog = "-"


def child_exit(server, worker):  # noqa: ANN001
    """Clean up a worker's metric samples on exit (multiprocess mode)."""
    if os.environ.get("PROMETHEUS_MULTIPROC_DIR"):
        from prometheus_client import multiprocess

        multiprocess.mark_process_dead(worker.pid)
