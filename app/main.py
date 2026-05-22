"""
Main FastAPI application entrypoint.
"""

from fastapi import FastAPI

from app.analyzer import analyze_ingredients
from app.rules import INGREDIENT_RULES
from app.schemas import AnalyzeRequest, AnalyzeResponse

app = FastAPI(
    title="Food Checker API",
    version="0.1.0",
    description="Ingredient analysis API for allergy and dietary filtering.",
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
    Return all available ingredient rules.
    """
    return INGREDIENT_RULES


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> dict:
    """
    Analyze ingredient text using user-selected rules.
    """
    result = analyze_ingredients(
        text=request.text,
        selected_rules=request.selected_rules,
    )

    return result