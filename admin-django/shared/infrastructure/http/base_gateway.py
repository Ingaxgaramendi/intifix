"""
Resilient HTTP gateway base class — the Anti-Corruption Layer between this
admin panel and the downstream microservices.

Responsibilities (Single Responsibility):
  - Resolve a service's base URL from settings.
  - Attach service-to-service auth and the propagated end-user bearer token.
  - Apply timeouts and bounded retries with exponential backoff for transient
    failures (connection errors, 5xx, 429).
  - Translate transport/HTTP errors into domain ``GatewayError`` subclasses so
    the rest of the app never sees a raw ``requests`` exception.

Concrete gateways (UsersGateway, PaymentsGateway, ...) subclass this and expose
intention-revealing methods (``list_users``, ``refund_payment``, ...). They are
the implementations of the repository ports declared in each bounded context's
domain layer (Dependency Inversion).
"""
from __future__ import annotations

import logging
import time
from typing import Any
from urllib.parse import urljoin

import requests
from django.conf import settings

from shared.domain.exceptions import (
    GatewayError,
    GatewayTimeoutError,
    GatewayUnauthorizedError,
)
from shared.interfaces.rest.middleware import get_request_id

logger = logging.getLogger("intifix.gateway")

_RETRYABLE_STATUS = {429, 502, 503, 504}
_IDEMPOTENT_METHODS = {"GET", "HEAD", "OPTIONS", "PUT", "DELETE"}


class BaseGateway:
    """Base class for all microservice gateways."""

    #: key into settings.GATEWAY["SERVICES"], set by each subclass.
    service_name: str = ""

    def __init__(self, *, bearer_token: str | None = None) -> None:
        if not self.service_name:
            raise ValueError(f"{type(self).__name__} must define `service_name`.")

        cfg = settings.GATEWAY
        try:
            self._base_url = cfg["SERVICES"][self.service_name].rstrip("/") + "/"
        except KeyError as exc:
            raise GatewayError(
                f"No base URL configured for service '{self.service_name}'."
            ) from exc

        self._timeout = cfg["TIMEOUT_SECONDS"]
        self._max_retries = cfg["MAX_RETRIES"]
        self._backoff = cfg["BACKOFF_FACTOR"]
        self._service_api_key = cfg["SERVICE_API_KEY"]
        self._bearer_token = bearer_token
        self._session = requests.Session()

    # -- Public verbs --------------------------------------------------------
    def get(self, path: str, *, params: dict | None = None) -> Any:
        return self._request("GET", path, params=params)

    def post(self, path: str, *, json: dict | None = None) -> Any:
        return self._request("POST", path, json=json)

    def put(self, path: str, *, json: dict | None = None) -> Any:
        return self._request("PUT", path, json=json)

    def patch(self, path: str, *, json: dict | None = None) -> Any:
        return self._request("PATCH", path, json=json)

    def delete(self, path: str) -> Any:
        return self._request("DELETE", path)

    # -- Internals -----------------------------------------------------------
    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/json",
            "X-Request-ID": get_request_id() or "-",
            "X-Internal-Service": "intifix-admin",
        }
        if self._service_api_key:
            headers["X-Service-Key"] = self._service_api_key
        if self._bearer_token:
            headers["Authorization"] = f"Bearer {self._bearer_token}"
        return headers

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        json: dict | None = None,
    ) -> Any:
        url = urljoin(self._base_url, path.lstrip("/"))
        attempts = self._max_retries if method in _IDEMPOTENT_METHODS else 1
        last_exc: Exception | None = None

        for attempt in range(1, attempts + 1):
            try:
                response = self._session.request(
                    method,
                    url,
                    params=params,
                    json=json,
                    headers=self._headers(),
                    timeout=self._timeout,
                )
            except requests.Timeout as exc:
                last_exc = exc
                logger.warning(
                    "gateway timeout service=%s %s %s attempt=%d/%d",
                    self.service_name, method, url, attempt, attempts,
                )
            except requests.RequestException as exc:
                last_exc = exc
                logger.warning(
                    "gateway connection error service=%s %s %s attempt=%d/%d err=%s",
                    self.service_name, method, url, attempt, attempts, exc,
                )
            else:
                if response.status_code in _RETRYABLE_STATUS and attempt < attempts:
                    logger.warning(
                        "gateway retryable status=%d service=%s %s attempt=%d/%d",
                        response.status_code, self.service_name, url, attempt, attempts,
                    )
                else:
                    return self._handle_response(response, method, url)

            if attempt < attempts:
                time.sleep(self._backoff * (2 ** (attempt - 1)))

        # All attempts exhausted.
        if isinstance(last_exc, requests.Timeout):
            raise GatewayTimeoutError(
                f"Service '{self.service_name}' timed out after {attempts} attempts."
            )
        raise GatewayError(
            f"Service '{self.service_name}' is unreachable after {attempts} attempts."
        )

    def _handle_response(self, response: requests.Response, method: str, url: str) -> Any:
        status = response.status_code
        logger.info("gateway %s %s -> %d", method, url, status)

        if status in (401, 403):
            raise GatewayUnauthorizedError(
                f"Upstream '{self.service_name}' rejected the credentials ({status}).",
            )
        if 400 <= status < 600:
            detail = self._safe_json(response)
            raise GatewayError(
                f"Upstream '{self.service_name}' returned {status}.",
                details={"upstream_status": status, "upstream_body": detail},
            )
        if status == 204 or not response.content:
            return None
        return self._unwrap(self._safe_json(response), method, url)

    def _unwrap(self, payload: Any, method: str, url: str) -> Any:
        """Adapt the backend's response shape to what the gateways expect.

        1. Unwrap Spring's ``ApiResponse`` envelope ``{success, message, data}``.
        2. Normalize a Spring ``Page`` (``{content, totalElements, number, ...}``)
           into the panel's ``{results, count, page, num_pages, page_size}`` shape.
        """
        data = payload
        if isinstance(payload, dict) and "data" in payload and (
            "success" in payload or "timestamp" in payload
        ):
            logger.debug("unwrapping ApiResponse wrapper from %s %s", method, url)
            data = payload["data"]

        if isinstance(data, dict) and "content" in data and "totalElements" in data:
            return {
                "results": data.get("content", []),
                "count": data.get("totalElements", 0),
                "page": data.get("number", 0) + 1,
                "num_pages": data.get("totalPages", 1),
                "page_size": data.get("size"),
            }
        return data

    @staticmethod
    def _safe_json(response: requests.Response) -> Any:
        try:
            return response.json()
        except ValueError:
            return response.text
