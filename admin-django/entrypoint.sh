#!/usr/bin/env sh
set -e

echo "[entrypoint] Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
python - <<'PY'
import os, time, socket
host = os.environ.get("POSTGRES_HOST", "postgres")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            print("[entrypoint] PostgreSQL is up.")
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("[entrypoint] PostgreSQL did not become available in time.")
PY

# Reset the Prometheus multiprocess dir on every boot so stale worker samples
# from a previous run are not served.
if [ -n "${PROMETHEUS_MULTIPROC_DIR}" ]; then
    echo "[entrypoint] Resetting Prometheus multiproc dir ${PROMETHEUS_MULTIPROC_DIR}..."
    rm -rf "${PROMETHEUS_MULTIPROC_DIR:?}"/* 2>/dev/null || true
    mkdir -p "${PROMETHEUS_MULTIPROC_DIR}"
fi

echo "[entrypoint] Applying database migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "[entrypoint] Starting: $*"
exec "$@"
