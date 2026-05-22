"""
Pydantic schemas for API request and response validation.

These models define the shape of data entering and leaving the API.
FastAPI uses them for:
- request validation
- response validation
- automatic API documentation
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """
    Request body for ingredient analysis.
    """

    text: str = Field(
        ...,
        min_length=1,
        description="Raw ingredient text entered by the user.",
    )

    selected_rules: list[str] = Field(
        ...,
        min_length=1,
        description="Rule IDs selected by the user.",
    )


class MatchResponse(BaseModel):
    """
    A detected ingredient match relevant to the user.
    """

    rule_id: str

    display_name: str

    category: str

    default_severity: str

    matched_ingredient: str

    matched_keyword: str


class AnalyzeResponse(BaseModel):
    """
    Full ingredient analysis response.
    """

    ingredients: list[str]

    selected_rules: list[str]

    matches: list[MatchResponse]

    safe_for_user: bool

    match_count: int


class ScanHistoryResponse(BaseModel):
    """
    Saved scan returned from scan history.
    """

    id: int

    raw_text: str

    selected_rules: list[str]

    result: dict[str, Any]

    created_at: datetime