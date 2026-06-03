from PIL import Image

from app.ocr import (
    clean_ocr_text,
    get_ocr_quality_warning,
    preprocess_image,
)


def test_clean_ocr_text_removes_common_label_noise():
    text = clean_ocr_text(
        "NUTRITION FACTS\nINGR3DIENTS: Wheat flour, sugar,, soy lecithin"
    )

    assert text == "wheat flour, sugar, soy lecithin"


def test_get_ocr_quality_warning_flags_short_noisy_text():
    warning = get_ocr_quality_warning("x7 ! 12")

    assert warning
    assert "OCR may be incomplete" in warning or "OCR could not read" in warning


def test_get_ocr_quality_warning_allows_ingredient_like_text():
    warning = get_ocr_quality_warning(
        "wheat flour, sugar, soybean oil, salt, soy lecithin, natural flavor"
    )

    assert warning is None


def test_preprocess_image_upscales_small_label_photo(tmp_path):
    image_path = tmp_path / "small-label.jpg"
    Image.new("RGB", (500, 300), "white").save(image_path)

    processed = preprocess_image(str(image_path))

    assert processed.width >= 1000
    assert processed.mode == "L"
