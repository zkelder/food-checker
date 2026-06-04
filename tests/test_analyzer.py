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


def test_alias_matching_flags_whey_as_milk_dairy():
    result = analyze_ingredients(
        ingredient_text="pea protein, whey isolate, cocoa",
        selected_rules=["milk"],
    )

    assert result["match_count"] == 1
    assert result["matches"][0]["label"] == "Milk / Dairy"
    assert result["matches"][0]["ingredient"] == "whey"


def test_matching_is_case_insensitive():
    result = analyze_ingredients(
        ingredient_text="Contains MILK POWDER and Sugar",
        selected_rules=["milk"],
    )

    assert result["match_count"] == 1
    assert result["matches"][0]["label"] == "Milk / Dairy"


def test_phrase_matching_flags_soy_lecithin():
    result = analyze_ingredients(
        ingredient_text="cocoa butter, soy-lecithin, vanilla",
        selected_rules=["soy"],
    )

    assert result["match_count"] == 1
    assert result["matches"][0]["label"] == "Soy"


def test_gluten_alias_matching_flags_durum_and_malt():
    result = analyze_ingredients(
        ingredient_text="durum semolina, barley malt, water",
        selected_rules=["gluten"],
    )

    assert result["match_count"] == 1
    assert result["matches"][0]["label"] == "Gluten / Wheat"


def test_additive_alias_matching_flags_artificial_colors():
    result = analyze_ingredients(
        ingredient_text="sugar, yellow #5, red 40, natural flavor",
        selected_rules=["artificial_colors"],
    )

    assert result["match_count"] == 1
    assert result["matches"][0]["label"] == "Artificial Colors"


def test_selected_rule_filtering_returns_only_selected_rules():
    result = analyze_ingredients(
        ingredient_text="milk powder, soy lecithin, peanut oil",
        selected_rules=["soy"],
    )

    assert result["match_count"] == 1
    assert result["matches"][0]["label"] == "Soy"


def test_keyword_substring_false_positive_does_not_match():
    result = analyze_ingredients(
        ingredient_text="soylent-style vanilla flavor, sugar",
        selected_rules=["soy"],
    )

    assert result["match_count"] == 0
    assert result["matches"] == []
