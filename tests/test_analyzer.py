from app.analyzer import analyze_ingredients, normalize_text


def test_normalize_text_returns_clean_text():
    result = normalize_text("  Wheat flour,   sugar, soy lecithin  ")

    assert result == "wheat flour, sugar, soy lecithin"


def test_analyzer_returns_selected_rule_matches_only():
    result = analyze_ingredients(
        ingredient_text="wheat flour, sugar, soy lecithin, peanut oil",
        selected_rules=["peanut", "soy"],
    )

    matched_labels = [match["label"] for match in result["matches"]]

    assert "Peanut" in matched_labels
    assert "Soy" in matched_labels
    assert "Gluten" not in matched_labels
    assert "Added Sugars" not in matched_labels


def test_analyzer_marks_food_safe_when_no_selected_rules_match():
    result = analyze_ingredients(
        ingredient_text="wheat flour, sugar, soy lecithin",
        selected_rules=["peanut"],
    )

    assert result["risk_level"] == "none"
    assert result["match_count"] == 0
    assert result["matches"] == []
