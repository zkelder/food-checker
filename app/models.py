(.venv) zkelder@DESKTOP-VENHFGI:~/projects/food-checker$ cd ~/projects/food-checker
cat app/models.py
cat app/schemas.py
cat app/database.py
cat app/main.py
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
    )"""
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

    selected_rules: list[str]"""
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
        db.close()"""
Main FastAPI application entrypoint.
"""

import json
import os
import tempfile

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.analyzer import analyze_ingredients
from app.config import CORS_ORIGINS
from app.database import Base, engine, get_db
from app.models import Scan, UserProfile
from app.ocr import extract_text_from_image, validate_image_upload
from app.rules import INGREDIENT_RULES
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ScanHistoryResponse,
    UpdateUserProfileRequest,
    UserProfileResponse,
)

LOCAL_PROFILE_USER_ID = "local-mvp-user"

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Food Checker API",
    version="0.1.0",
    description="Ingredient analysis API for allergy and dietary filtering.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_or_create_local_profile(db: Session) -> UserProfile:
    """
    Get or create the single MVP profile.

    Later, this will be replaced by the authenticated Supabase user id.
    """
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == LOCAL_PROFILE_USER_ID)
        .first()
    )

    if profile:
        return profile

    profile = UserProfile(
        user_id=LOCAL_PROFILE_USER_ID,
        selected_rules=[],
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@app.get("/health")
def health_check() -> dict:
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}


@app.get("/rules")
def get_rules() -> dict:
    """
    Return all available ingredient screening rules.
    """
    return INGREDIENT_RULES


@app.get("/profile", response_model=UserProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
) -> UserProfile:
    """
    Return the current MVP profile.
    """
    return get_or_create_local_profile(db)


@app.put("/profile", response_model=UserProfileResponse)
def update_profile(
    request: UpdateUserProfileRequest,
    db: Session = Depends(get_db),
) -> UserProfile:
    """
    Update the current MVP profile preferences.
    """
    profile = get_or_create_local_profile(db)

    profile.selected_rules = request.selected_rules

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    """
    Analyze ingredient text against selected rules and save the scan.
    """
    cleaned_text = " ".join(request.text.split()).lower()

    result = analyze_ingredients(
        ingredient_text=cleaned_text,
        selected_rules=request.selected_rules,
    )

    scan = Scan(
        raw_text=cleaned_text,
        selected_rules=request.selected_rules,
        result=result,
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    return result


@app.post("/scan/image", response_model=AnalyzeResponse)
def scan_image(
    file: UploadFile = File(...),
    selected_rules: str = Form("[]"),
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    """
    Accept an uploaded ingredient label image, extract text, analyze it
    against selected rules, and save the scan.
    """
    temp_path = None

    try:
        validate_image_upload(file)

        try:
            parsed_selected_rules = json.loads(selected_rules)
        except json.JSONDecodeError:
            parsed_selected_rules = []

        if not isinstance(parsed_selected_rules, list):
            parsed_selected_rules = []

        suffix = os.path.splitext(file.filename or "")[1] or ".jpg"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file.file.read())
            temp_path = temp_file.name

        extracted_text = extract_text_from_image(temp_path)

        cleaned_text = (
            extracted_text.replace("\n", " ")
            .replace("INGREDIENTS:", "")
            .replace("Ingredients:", "")
            .replace("ingredients:", "")
            .strip()
        )

        cleaned_text = " ".join(cleaned_text.split()).lower()

        result = analyze_ingredients(
            ingredient_text=cleaned_text,
            selected_rules=parsed_selected_rules,
        )

        scan = Scan(
            raw_text=cleaned_text,
            selected_rules=parsed_selected_rules,
            result=result,
        )

        db.add(scan)
        db.commit()
        db.refresh(scan)

        return result

    except RuntimeError as error:
        if "Tesseract process timeout" in str(error):
            raise HTTPException(
                status_code=408,
                detail=(
                    "OCR timed out. Try a clearer, closer photo of the "
                    "ingredients label."
                ),
            )

        raise HTTPException(status_code=500, detail="OCR processing failed.")

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/history", response_model=list[ScanHistoryResponse])
def get_history(
    db: Session = Depends(get_db),
) -> list[ScanHistoryResponse]:
    """
    Return previously saved scans, newest first.
    """
    scans = db.query(Scan).order_by(Scan.created_at.desc()).all()

    return scans(.venv) zkelder@DESKTOP-VENHFGI:~/projects/food-checker$ 