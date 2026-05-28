"""
Database models for persisted application data.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Scan(Base):
    """
    Saved ingredient analysis scan.

    Scans include a user_id so history can be filtered per user.
    For the current MVP, this uses a single fallback local user id.
    Later, this will be replaced by the authenticated Supabase user id.
    """

    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
        default="local-mvp-user",
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


class UserProfile(Base):
    """
    Future-ready user profile model.

    For now, the MVP uses a single local profile record.
    Later this connects to Supabase Auth users.
    """

    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        unique=True,
        index=True,
    )

    selected_rules: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )