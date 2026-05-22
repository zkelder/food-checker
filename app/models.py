"""
Database models for persisted application data.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Scan(Base):
    """
    Saved ingredient analysis scan.

    For the MVP, scans are not tied to user accounts yet.
    The selected rules act as a temporary user profile snapshot.
    """

    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    raw_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    selected_rules: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    result: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )