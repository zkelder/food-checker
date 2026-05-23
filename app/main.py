"""
Main FastAPI application entrypoint.
"""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.analyzer import analyze_ingredients
from app.database import Base, engine, get_db
from app.models import Scan
from app.rules import INGREDIENT_RULES
from app.schemas import AnalyzeRequest, AnalyzeResponse, ScanHistoryResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Food Checker API",
    version="0.1.0",
    description="Ingredient analysis API for allergy and dietary filtering.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    """
    Analyze ingredient text against selected rules and save the scan.
    """
    result = analyze_ingredients(
        ingredient_text=request.text,
        selected_rules=request.selected_rules,
    )

    scan = Scan(
        raw_text=request.text,
        selected_rules=request.selected_rules,
        result=result,
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    return result


@app.get("/history", response_model=list[ScanHistoryResponse])
def get_history(
    db: Session = Depends(get_db),
) -> list[ScanHistoryResponse]:
    """
    Return previously saved scans, newest first.
    """
    scans = (
        db.query(Scan)
        .order_by(Scan.created_at.desc())
        .all()
    )

    return scans