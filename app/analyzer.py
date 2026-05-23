"""
Ingredient analysis logic.

Keep this module independent from FastAPI, database code, auth,
OCR, barcode scanning, or frontend concerns.
"""

import re

from app.rules import INGREDIENT_RULES


SEVERITY_RANK = {
    "none": 0,
    "info": 1,
    "low": 2,
    "medium": 3,
    "high": 4,
}


def normalize_text(text: str | None) -> str:
    """
    Normalize ingredient text for consistent matching.
    """
    if not text:
        return ""

    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)

    return text


def ingredient_matches_text(ingredient: str, text: str) -> bool:
    """
    Match ingredients as words/phrases, not random substrings.
    """
    pattern = r"\b" + re.escape(ingredient.lower()) + r"\b"
    return re.search(pattern, text) is not None


def find_matching_rules(ingredient_text: str) -> list[dict]:
    """
    Find all ingredient rules that match the input text.
    """
    normalized_text = normalize_text(ingredient_text)
    matches = []

    for ingredient, rule in INGREDIENT_RULES.items():
        if ingredient_matches_text(ingredient, normalized_text):
            matches.append(
                {
                    "ingredient": ingredient,
                    "label": rule.get("label", ingredient),
                    "warning": rule.get("warning", ""),
                    "severity": rule.get("severity", "info"),
                    "category": rule.get("category", "general"),
                }
            )

    return matches


def determine_risk_level(matches: list[dict]) -> str:
    """
    Determine overall risk level based on highest severity found.
    """
    if not matches:
        return "none"

    highest_match = max(
        matches,
        key=lambda match: SEVERITY_RANK.get(match.get("severity", "info"), 1),
    )

    return highest_match.get("severity", "info")


def build_summary(matches: list[dict], risk_level: str) -> str:
    """
    Create a simple user-facing summary.
    """
    if not matches:
        return "No flagged ingredients found."

    ingredient_names = [match["label"] for match in matches]

    if risk_level == "high":
        return f"High-risk ingredients found: {', '.join(ingredient_names)}."
    if risk_level == "medium":
        return f"Ingredients that may need attention: {', '.join(ingredient_names)}."
    if risk_level == "low":
        return f"Minor ingredient notes found: {', '.join(ingredient_names)}."

    return f"Ingredient notes found: {', '.join(ingredient_names)}."


def analyze_ingredients(ingredient_text: str | None) -> dict:
    """
    Analyze ingredient text and return structured results.
    """
    normalized_text = normalize_text(ingredient_text)

    if not normalized_text:
        return {
            "input_text": ingredient_text or "",
            "normalized_text": "",
            "risk_level": "none",
            "summary": "No ingredient text provided.",
            "matches": [],
            "match_count": 0,
        }

    matches = find_matching_rules(normalized_text)
    risk_level = determine_risk_level(matches)

    return {
        "input_text": ingredient_text,
        "normalized_text": normalized_text,
        "risk_level": risk_level,
        "summary": build_summary(matches, risk_level),
        "matches": matches,
        "match_count": len(matches),
    }