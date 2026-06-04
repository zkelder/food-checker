import asyncio
import json
import os
from collections.abc import Callable
from contextlib import asynccontextmanager, contextmanager
from typing import Any

from fastapi.testclient import TestClient

import fastapi.concurrency
import fastapi.dependencies.utils
import fastapi.routing
from app.main import app


client = TestClient(app) if os.getenv("CI") == "true" else None

SAMPLE_INGREDIENTS = "milk, wheat flour, soybean oil, red 40, sugar"


@contextmanager
def inline_threadpool_for_local_tests():
    """
    The local Codex sandbox hangs on Python thread portals. GitHub Actions uses
    TestClient normally; local tests run the same ASGI app without threads.
    """
    original_concurrency_run_in_threadpool = fastapi.concurrency.run_in_threadpool
    original_contextmanager_in_threadpool = (
        fastapi.concurrency.contextmanager_in_threadpool
    )
    original_dependency_contextmanager_in_threadpool = (
        fastapi.dependencies.utils.contextmanager_in_threadpool
    )
    original_dependency_run_in_threadpool = fastapi.dependencies.utils.run_in_threadpool
    original_run_in_threadpool = fastapi.routing.run_in_threadpool

    async def run_inline(func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        return func(*args, **kwargs)

    @asynccontextmanager
    async def contextmanager_inline(cm: Any):
        try:
            yield cm.__enter__()
        except Exception as error:
            if not cm.__exit__(type(error), error, error.__traceback__):
                raise
        else:
            cm.__exit__(None, None, None)

    fastapi.concurrency.run_in_threadpool = run_inline
    fastapi.concurrency.contextmanager_in_threadpool = contextmanager_inline
    fastapi.dependencies.utils.contextmanager_in_threadpool = contextmanager_inline
    fastapi.dependencies.utils.run_in_threadpool = run_inline
    fastapi.routing.run_in_threadpool = run_inline

    try:
        yield
    finally:
        fastapi.concurrency.run_in_threadpool = original_concurrency_run_in_threadpool
        fastapi.concurrency.contextmanager_in_threadpool = (
            original_contextmanager_in_threadpool
        )
        fastapi.dependencies.utils.contextmanager_in_threadpool = (
            original_dependency_contextmanager_in_threadpool
        )
        fastapi.dependencies.utils.run_in_threadpool = (
            original_dependency_run_in_threadpool
        )
        fastapi.routing.run_in_threadpool = original_run_in_threadpool


async def direct_asgi_request(
    method: str,
    path: str,
    *,
    json_body: dict[str, Any] | None = None,
) -> tuple[int, dict[str, Any]]:
    body = b""
    headers = []

    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        headers.append((b"content-type", b"application/json"))

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("ascii"),
        "query_string": b"",
        "headers": headers,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
    }

    messages: list[dict[str, Any]] = []
    request_sent = False

    async def receive() -> dict[str, Any]:
        nonlocal request_sent

        if not request_sent:
            request_sent = True
            return {
                "type": "http.request",
                "body": body,
                "more_body": False,
            }

        return {"type": "http.disconnect"}

    async def send(message: dict[str, Any]) -> None:
        messages.append(message)

    with inline_threadpool_for_local_tests():
        await app(scope, receive, send)

    status_code = next(
        message["status"]
        for message in messages
        if message["type"] == "http.response.start"
    )
    response_body = b"".join(
        message.get("body", b"")
        for message in messages
        if message["type"] == "http.response.body"
    )

    return status_code, json.loads(response_body or b"{}")


def request_json(
    method: str,
    path: str,
    *,
    json_body: dict[str, Any] | None = None,
) -> tuple[int, dict[str, Any]]:
    if client is not None:
        response = client.request(method, path, json=json_body)
        return response.status_code, response.json()

    return asyncio.run(
        direct_asgi_request(method, path, json_body=json_body),
    )


def test_health_returns_ok_status():
    status_code, body = request_json("GET", "/health")

    assert status_code == 200
    assert body["status"] in {"ok", "healthy"}


def test_rules_returns_non_empty_payload():
    status_code, rules = request_json("GET", "/rules")

    assert status_code == 200
    assert isinstance(rules, dict)
    assert rules


def test_analyze_accepts_sample_ingredients():
    status_code, result = request_json(
        "POST",
        "/analyze",
        json_body={
            "text": SAMPLE_INGREDIENTS,
            "selected_rules": [],
        },
    )

    assert status_code == 200
    assert result["input_text"] == SAMPLE_INGREDIENTS.lower()
    assert result["normalized_text"] == SAMPLE_INGREDIENTS.lower()
    assert isinstance(result["matches"], list)
    assert isinstance(result["match_count"], int)
    assert "summary" in result


def test_analyze_selected_rules_filter_does_not_crash():
    status_code, result = request_json(
        "POST",
        "/analyze",
        json_body={
            "text": SAMPLE_INGREDIENTS,
            "selected_rules": ["milk", "gluten", "soy"],
        },
    )

    assert status_code == 200
    assert result["match_count"] >= 1
    assert {match["label"] for match in result["matches"]}.issubset(
        {"Milk", "Gluten", "Soy"},
    )
