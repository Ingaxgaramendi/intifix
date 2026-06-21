# =============================================================================
# Intifix Admin — production image (multi-stage)
# =============================================================================
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# --- Builder: install dependencies into a venv ---
FROM base AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements/ requirements/
RUN pip install -r requirements/production.txt

# --- Final runtime image ---
FROM base AS runtime

# libpq for psycopg2 at runtime; curl for the container healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user.
RUN addgroup --system intifix && adduser --system --ingroup intifix intifix

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Prometheus multiprocess metrics dir (aggregates samples across gunicorn workers).
ENV PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus_multiproc

WORKDIR /app
COPY . .
RUN chmod +x ./entrypoint.sh \
    && mkdir -p /app/logs /app/staticfiles "$PROMETHEUS_MULTIPROC_DIR" \
    && chown -R intifix:intifix /app "$PROMETHEUS_MULTIPROC_DIR"

USER intifix

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health/ || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "intifix_admin.wsgi:application", "--config", "gunicorn.conf.py"]
