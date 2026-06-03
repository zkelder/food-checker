"""
Main FastAPI application entrypoint.
"""

import json
import os

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.analyzer import analyze_ingredients
from app.auth import get_current_user_id
from app.config import CORS_ORIGINS
from app.database import Base, engine, get_db
from app.models import Scan, UserProfile
from app.ocr import (
    extract_text_from_image,
    get_ocr_quality_warning,
    save_upload_to_temp_file,
    validate_image_upload,
)
from app.rules import INGREDIENT_RULES
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ScanHistoryResponse,
    UpdateUserProfileRequest,
    UserProfileResponse,
)

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


def get_or_create_profile(db: Session, user_id: str) -> UserProfile:
    """
    Get or create a user profile.
    """
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .first()
    )

    if profile:
        return profile

    profile = UserProfile(
        user_id=user_id,
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
    user_id: str = Depends(get_current_user_id),
) -> UserProfile:
    """
    Return the current user's profile.
    """
    return get_or_create_profile(db, user_id)


@app.put("/profile", response_model=UserProfileResponse)
def update_profile(
    request: UpdateUserProfileRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> UserProfile:
    """
    Update the current user's profile preferences.
    """
    profile = get_or_create_profile(db, user_id)

    profile.selected_rules = request.selected_rules

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
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
        user_id=user_id,
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
    user_id: str = Depends(get_current_user_id),
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

        temp_path = save_upload_to_temp_file(file, suffix)

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
        result["ocr_warning"] = get_ocr_quality_warning(cleaned_text)

        scan = Scan(
            user_id=user_id,
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
    user_id: str = Depends(get_current_user_id),
) -> list[ScanHistoryResponse]:
    """
    Return the current user's saved scans, newest first.
    """
    scans = (
        db.query(Scan)
        .filter(Scan.user_id == user_id)
        .order_by(Scan.created_at.desc())
        .all()
    )

    return scans
