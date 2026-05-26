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


CORS_ORIGINS = parse_csv_env(
    os.getenv("CORS_ORIGINS"),
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
)
