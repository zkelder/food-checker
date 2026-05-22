"""
Database configuration and session management.

This module owns:
- loading the database URL
- creating the SQLAlchemy engine
- creating database sessions
- providing a FastAPI dependency for routes

The app defaults to SQLite for local development, but can switch to
PostgreSQL later by setting DATABASE_URL in the environment.
"""

import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./food_checker.db",
)

engine_options = {}

if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    **engine_options,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Create and clean up a database session for each request.

    FastAPI uses this as a dependency so route handlers can safely
    interact with the database without manually opening/closing sessions.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()