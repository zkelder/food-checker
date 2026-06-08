"""
Main FastAPI application entrypoint.
"""

import logging
import json
import os
import time
import uuid
from contextvars import ContextVar

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy.orm import Session

from app.analyzer import analyze_ingredients
from app.auth import get_current_user_id
from app.config import APP_ENVIRONMENT, APP_NAME, APP_VERSION, CORS_ORIGINS
from app.database import Base, engine, get_db
from app.models import Scan, UserProfile
from app.ocr import (
    UploadTooLargeError,
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

logger = logging.getLogger("food_checker.api")
request_id_context: ContextVar[str | None] = ContextVar(
    "request_id",
    default=None,
)
HTTP_REQUESTS_TOTAL = Counter(
    "food_checker_http_requests_total",
    "Total HTTP requests handled by the Food Checker API.",
    ("method", "path", "status_code"),
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "food_checker_http_request_duration_seconds",
    "HTTP request duration in seconds for the Food Checker API.",
    ("method", "path", "status_code"),
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Ingredient analysis API for allergy and dietary filtering.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_request_id() -> str | None:
    """
    Return the current request id, when one is active.
    """
    return request_id_context.get()


def get_metrics_path(request: Request) -> str:
    """
    Return a low-cardinality path label for Prometheus metrics.
    """
    route = request.scope.get("route")
    route_path = getattr(route, "path", None)
    if isinstance(route_path, str):
        return route_path
    return "unmatched"


@app.middleware("http")
async def request_observability_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = request_id_context.set(request_id)
    start_time = time.perf_counter()
    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception:
        logger.exception(
            "Unhandled request error method=%s path=%s request_id=%s",
            request.method,
            request.url.path,
            request_id,
        )
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error."},
        )
    finally:
        duration_seconds = time.perf_counter() - start_time
        duration_ms = round(duration_seconds * 1000, 2)
        logger.info(
            "request method=%s path=%s status_code=%s duration_ms=%.2f request_id=%s",
            request.method,
            request.url.path,
            status_code,
            duration_ms,
            request_id,
        )
        metrics_path = get_metrics_path(request)
        metric_labels = (request.method, metrics_path, str(status_code))
        HTTP_REQUESTS_TOTAL.labels(*metric_labels).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(*metric_labels).observe(
            duration_seconds,
        )
        request_id_context.reset(token)

    response.headers["X-Request-ID"] = request_id
    return response


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


@app.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    """
    Return Prometheus metrics for private scraping.
    """
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/status")
def status() -> dict:
    """
    Return public-safe service status metadata.
    """
    return {
        "status": "ok",
        "service": "food-checker-api",
        "version": APP_VERSION,
        "environment": APP_ENVIRONMENT,
    }


@app.get("/version")
def version() -> dict:
    """
    Return non-secret service version metadata.
    """
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "environment": APP_ENVIRONMENT,
    }


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

        try:
            extracted_text = extract_text_from_image(temp_path)
        except ValueError as error:
            logger.warning(
                "OCR rejected upload request_id=%s error=%s",
                get_request_id(),
                error,
            )
            raise HTTPException(status_code=400, detail=str(error))
        except OSError as error:
            logger.warning(
                "OCR could not decode image request_id=%s error=%s",
                get_request_id(),
                error,
            )
            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not process this image. Please upload a valid JPG, "
                    "PNG, or WEBP image."
                ),
            )

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
            logger.warning(
                "OCR timed out request_id=%s error=%s",
                get_request_id(),
                error,
            )
            raise HTTPException(
                status_code=408,
                detail=(
                    "OCR timed out. Try a clearer, closer photo of the "
                    "ingredients label."
                ),
            )

        logger.exception(
            "OCR processing failed request_id=%s",
            get_request_id(),
        )
        raise HTTPException(status_code=500, detail="OCR processing failed.")

    except UploadTooLargeError as error:
        raise HTTPException(status_code=413, detail=str(error))

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
