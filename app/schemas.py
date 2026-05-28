"""
API request and response schemas.

These schemas define the structure of data exchanged
between the frontend and backend.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    """
    Incoming ingredient analysis request from the frontend.
    """

    text: str
    selected_rules: list[str] = []


class MatchResponse(BaseModel):
    """
    Single ingredient match returned by the analyzer.
    """

    ingredient: str
    label: str
    warning: str
    severity: str
    category: str


class AnalyzeResponse(BaseModel):
    """
    Full analysis response returned to the frontend.
    """

    input_text: str
    normalized_text: str
    risk_level: str
    summary: str
    matches: list[MatchResponse]
    match_count: int


class ScanHistoryResponse(BaseModel):
    """
    Saved scan history entry returned from the database.
    """

    id: int
    user_id: str
    raw_text: str
    selected_rules: list[str]
    result: dict[str, Any]
    created_at: datetime

    class Config:
        """
        Allow Pydantic to read SQLAlchemy model objects directly.
        """

        from_attributes = True


class UserProfileResponse(BaseModel):
    """
    Current user profile response.
    """

    id: int
    user_id: str | None
    selected_rules: list[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateUserProfileRequest(BaseModel):
    """
    Update profile preferences request.
    """

    selected_rules: list[str]