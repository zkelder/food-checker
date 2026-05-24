"""
Ingredient analysis logic.

This module keeps matching rules separate from FastAPI,
database, OCR, barcode scanning, and frontend code.
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
    Normalize ingredient text before matching.
    """
    if not text:
        return ""

    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)

    return text


def keyword_matches_text(keyword: str, text: str) -> bool:
    """
    Match a keyword as a word or phrase instead of a random substring.
    """
    pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
    return re.search(pattern, text) is not None


def get_rule_keywords(rule_id: str, rule: dict) -> list[str]:
    """
    Return all searchable keywords for a rule.
    """
    keywords = list(rule.get("keywords", []))

    if rule_id not in keywords:
        keywords.append(rule_id)

    return keywords


def find_matching_rules(
    ingredient_text: str,
    selected_rules: list[str] | None = None,
) -> list[dict]:
    """
    Find selected rules that match the ingredient text.
    """
    normalized_text = normalize_text(ingredient_text)
    matches = []

    if not selected_rules:
        return []

    rules_to_check = {
        rule_id: rule
        for rule_id, rule in INGREDIENT_RULES.items()
        if rule_id in selected_rules
    }

    for rule_id, rule in rules_to_check.items():
        keywords = get_rule_keywords(rule_id, rule)

        for keyword in keywords:
            if keyword_matches_text(keyword, normalized_text):
                matches.append(
                    {
                        "ingredient": keyword,
                        "label": rule.get("display_name", rule.get("label", rule_id)),
                        "warning": rule.get("warning", ""),
                        "severity": rule.get(
                            "default_severity",
                            rule.get("severity", "info"),
                        ),
                        "category": rule.get("category", "general"),
                    }
                )
                break

    return matches


def determine_risk_level(matches: list[dict]) -> str:
    """
    Determine overall risk level from the highest matching severity.
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
    Create a short user-facing result summary.
    """
    if not matches:
        return "No flagged ingredients found."

    labels = [match["label"] for match in matches]

    if risk_level == "high":
        return f"High-risk ingredients found: {', '.join(labels)}."
    if risk_level == "medium":
        return f"Ingredients that may need attention: {', '.join(labels)}."
    if risk_level == "low":
        return f"Minor ingredient notes found: {', '.join(labels)}."

    return f"Ingredient notes found: {', '.join(labels)}."


def analyze_ingredients(
    ingredient_text: str | None,
    selected_rules: list[str] | None = None,
) -> dict:
    """
    Analyze ingredient text against selected screening rules.
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

    matches = find_matching_rules(normalized_text, selected_rules)
    risk_level = determine_risk_level(matches)

    return {
        "input_text": ingredient_text or "",
        "normalized_text": normalized_text,
        "risk_level": risk_level,
        "summary": build_summary(matches, risk_level),
        "matches": matches,
        "match_count": len(matches),
    }