"""
Application configuration.

Centralizes environment-based settings so local development and deployment
can use the same code with different environment variables.
"""

import os

from dotenv import load_dotenv

load_dotenv()


def parse_csv_env(value: str | None, default: list[str]) -> list[str]:
    """
    Parse a comma-separated environment variable into a clean list.
    """
    if not value:
        return default

    return [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]


def parse_int_env(value: str | None, default: int) -> int:
    """
    Parse an integer environment variable with a safe fallback.
    """
    if not value:
        return default

    try:
        parsed = int(value)
    except ValueError:
        return default

    return parsed if parsed > 0 else default


APP_NAME = "Food Checker API"
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
APP_ENVIRONMENT = os.getenv("APP_ENVIRONMENT", "development")
MAX_IMAGE_UPLOAD_BYTES = parse_int_env(
    os.getenv("MAX_IMAGE_UPLOAD_BYTES"),
    8 * 1024 * 1024,
)

CORS_ORIGINS = parse_csv_env(
    os.getenv("CORS_ORIGINS"),
    [
        "https://zkelder.dev",
        "https://www.zkelder.dev",
        "https://foodchecker.zkelder.dev",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
)
