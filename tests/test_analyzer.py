from app.analyzer import analyze_ingredients, parse_ingredients


def test_parse_ingredients_returns_clean_list():
    result = parse_ingredients("Wheat flour, sugar, soy lecithin")

    assert result == [
        "wheat flour",
        "sugar",
        "soy lecithin",
    ]


def test_analyzer_returns_selected_rule_matches_only():
    result = analyze_ingredients(
        text="wheat flour, sugar, soy lecithin, peanut oil",
        selected_rules=["peanut", "soy"],
    )

    matched_rules = [match["rule_id"] for match in result["matches"]]

    assert "peanut" in matched_rules
    assert "soy" in matched_rules
    assert "gluten" not in matched_rules
    assert "added_sugars" not in matched_rules


def test_analyzer_marks_food_safe_when_no_selected_rules_match():
    result = analyze_ingredients(
        text="wheat flour, sugar, soy lecithin",
        selected_rules=["peanut"],
    )

    assert result["safe_for_user"] is True
    assert result["match_count"] == 0
    assert result["matches"] == []