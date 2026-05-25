"""
Main FastAPI application entrypoint.
"""

import json
import os
import tempfile

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.analyzer import analyze_ingredients
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
    allow_origins=["*"],
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

    return scans