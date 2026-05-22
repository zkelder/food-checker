"""
Core ingredient analysis logic.

The analyzer accepts raw ingredient text and a list of user-selected rules,
then returns only the matches relevant to that user's allergies or preferences.
"""

import re

from app.rules import INGREDIENT_RULES


def normalize_text(text: str) -> str:
    """Normalize text for consistent matching."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s,/-]", "", text)
    text = re.sub(r"\s+", " ", text)

    return text


def parse_ingredients(text: str) -> list[str]:
    """Parse raw ingredient text into a cleaned list."""
    normalized_text = normalize_text(text)
    raw_ingredients = normalized_text.split(",")

    ingredients = []

    for ingredient in raw_ingredients:
        cleaned = ingredient.strip()

        if cleaned:
            ingredients.append(cleaned)

    return ingredients


def normalize_selected_rules(selected_rules: list[str]) -> set[str]:
    """Normalize selected rule IDs from user input."""
    return {normalize_text(rule) for rule in selected_rules}


def find_matches(
    ingredients: list[str],
    selected_rules: list[str],
) -> list[dict]:
    """Find matches only for rules selected by the user."""
    normalized_selected_rules = normalize_selected_rules(selected_rules)

    matches = []
    seen_matches = set()

    for rule_id, rule_data in INGREDIENT_RULES.items():
        if rule_id not in normalized_selected_rules:
            continue

        for ingredient in ingredients:
            for keyword in rule_data["keywords"]:
                normalized_keyword = normalize_text(keyword)

                if normalized_keyword in ingredient:
                    match_key = (rule_id, ingredient)

                    if match_key in seen_matches:
                        continue

                    seen_matches.add(match_key)

                    matches.append(
                        {
                            "rule_id": rule_id,
                            "display_name": rule_data["display_name"],
                            "category": rule_data["category"],
                            "default_severity": rule_data["default_severity"],
                            "matched_ingredient": ingredient,
                            "matched_keyword": keyword,
                        }
                    )

    return matches


def analyze_ingredients(text: str, selected_rules: list[str]) -> dict:
    """Analyze ingredient text against selected user rules."""
    ingredients = parse_ingredients(text)
    matches = find_matches(ingredients, selected_rules)

    return {
        "ingredients": ingredients,
        "selected_rules": selected_rules,
        "matches": matches,
        "safe_for_user": len(matches) == 0,
        "match_count": len(matches),
    }