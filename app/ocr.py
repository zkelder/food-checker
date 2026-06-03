"""
OCR service layer.

Handles image validation, phone-photo preprocessing, OCR extraction,
fallback OCR attempts, and cleanup of noisy OCR text.
"""

import os
import re
import tempfile
import time

import pytesseract
from fastapi import UploadFile
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
UPLOAD_READ_CHUNK_SIZE_BYTES = 1024 * 1024
MIN_OCR_TEXT_LENGTH = 8
GOOD_OCR_SCORE = 650
LOW_CONFIDENCE_OCR_SCORE = 260


def validate_image_upload(file: UploadFile) -> None:
    """
    Validate that the uploaded file is an image type and size we support.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Unsupported image type. Please upload JPG, PNG, or WEBP.")

    if file.size and file.size > MAX_IMAGE_SIZE_BYTES:
        raise ValueError("Image is too large. Please upload an image under 8 MB.")


def save_upload_to_temp_file(file: UploadFile, suffix: str) -> str:
    """
    Save an uploaded image to a temp file while enforcing the size limit.
    """
    temp_path = None
    bytes_written = 0

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name

            while True:
                chunk = file.file.read(UPLOAD_READ_CHUNK_SIZE_BYTES)

                if not chunk:
                    break

                bytes_written += len(chunk)

                if bytes_written > MAX_IMAGE_SIZE_BYTES:
                    raise ValueError(
                        "Image is too large. Please upload an image under 8 MB."
                    )

                temp_file.write(chunk)

        return temp_path
    except Exception:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        raise


def preprocess_image(file_path: str) -> Image.Image:
    """
    Prepare phone label photos for OCR.

    Keep enough resolution for dense ingredient text while avoiding giant
    iPhone images that can make Tesseract timeout.
    """
    image = Image.open(file_path)
    image = ImageOps.exif_transpose(image)

    min_width = 1400
    max_width = 2200
    width, height = image.size

    if width < min_width:
        scale = min(2.0, min_width / width)
        image = image.resize((int(width * scale), int(height * scale)))
    elif width > max_width:
        scale = max_width / width
        image = image.resize((max_width, int(height * scale)))

    image = image.convert("L")
    image = ImageOps.autocontrast(image)
    image = ImageEnhance.Contrast(image).enhance(1.35)
    image = ImageEnhance.Sharpness(image).enhance(1.4)
    image = image.filter(ImageFilter.UnsharpMask(radius=1, percent=140, threshold=3))

    return image


def threshold_image(image: Image.Image, cutoff: int = 165) -> Image.Image:
    """
    Create a high-contrast black-and-white copy for fallback OCR.
    """
    return image.point(lambda pixel: 255 if pixel > cutoff else 0)


def clean_ocr_text(text: str) -> str:
    """
    Clean raw OCR output without changing ingredient meaning.
    """
    text = text.replace("\n", " ")
    text = text.replace("\r", " ")
    text = text.replace("\t", " ")

    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'")
    text = text.replace("—", "-").replace("–", "-")

    text = re.sub(r"\bINGREDIENTS?\s*[:\-]?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\bINGR[E3]D[I1]ENTS?\s*[:\-]?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\bNUTRITION FACTS\b", " ", text, flags=re.IGNORECASE)

    # Fix OCR splitting around hyphenated words: "RIBO- FLAVIN" -> "RIBOFLAVIN"
    text = re.sub(r"([A-Za-z])-\s+([A-Za-z])", r"\1\2", text)

    # Normalize color/additive patterns: "RED #40" -> "RED 40"
    text = re.sub(r"#\s*(\d+)", r"\1", text)

    # Remove obvious OCR junk while keeping ingredient punctuation.
    text = re.sub(r"[^A-Za-z0-9,.;:()/%&+\-'\s]", " ", text)

    # Normalize punctuation spacing.
    text = re.sub(r"\s+([,.;:)])", r"\1", text)
    text = re.sub(r"([(:])\s+", r"\1", text)
    text = re.sub(r"\s*,\s*", ", ", text)
    text = re.sub(r",\s*,+", ",", text)
    text = re.sub(r"[,;]{2,}", ",", text)

    # Remove repeated whitespace.
    text = re.sub(r"\s+", " ", text)

    return text.strip().lower()


def get_ocr_quality_warning(text: str) -> str | None:
    """
    Return a user-facing warning when OCR text looks incomplete or noisy.
    """
    normalized_text = clean_ocr_text(text)

    if not normalized_text:
        return "OCR could not read much text. Try a closer photo of only the ingredients panel."

    alpha_chars = re.findall(r"[a-zA-Z]", normalized_text)
    alpha_ratio = len(alpha_chars) / max(len(normalized_text), 1)
    words = re.findall(r"[a-zA-Z]{2,}", normalized_text)
    ingredient_like_terms = [
        "contains",
        "may contain",
        "milk",
        "wheat",
        "soy",
        "egg",
        "peanut",
        "sugar",
        "salt",
        "oil",
        "flour",
        "lecithin",
        "citric acid",
    ]

    has_list_structure = normalized_text.count(",") >= 2 or ";" in normalized_text
    has_ingredient_signal = any(term in normalized_text for term in ingredient_like_terms)
    score = score_ocr_text(normalized_text)

    if (
        len(normalized_text) < 40
        or len(words) < 5
        or alpha_ratio < 0.55
        or score < LOW_CONFIDENCE_OCR_SCORE
        or (not has_list_structure and not has_ingredient_signal)
    ):
        return (
            "OCR may be incomplete or inaccurate. Try a closer, well-lit photo "
            "with the label flat and cropped to the ingredients panel."
        )

    return None


def score_ocr_text(text: str) -> int:
    """
    Score OCR attempts by ingredient-list usefulness.

    We reward coherent ingredient-list structure more than just catching
    one or two allergen words. This helps preserve longer ingredient lists.
    """
    if not text:
        return 0

    score = len(text)

    ingredient_keywords = [
        "ingredients",
        "contains",
        "may contain",
        "milk",
        "wheat",
        "soy",
        "egg",
        "peanut",
        "tree nut",
        "almond",
        "cashew",
        "sugar",
        "salt",
        "oil",
        "flour",
        "corn",
        "natural flavor",
        "citric acid",
        "lecithin",
        "riboflavin",
        "niacin",
        "niacinamide",
        "thiamin",
        "cyanocobalamin",
        "folic acid",
        "calcium",
        "potassium",
        "monoglycerides",
        "diglycerides",
    ]

    for keyword in ingredient_keywords:
        if keyword in text:
            score += 60

    # Ingredient lists usually have comma-separated structure.
    score += text.count(",") * 18
    score += text.count("(") * 8
    score += text.count(")") * 8

    words = re.findall(r"[a-zA-Z]{2,}", text)
    long_words = [word for word in words if len(word) >= 6]
    very_short_words = [word for word in words if len(word) <= 2]

    # Long chemical/ingredient words are useful signal.
    score += len(long_words) * 12

    # Too many tiny fragments usually means noisy OCR.
    score -= len(very_short_words) * 4

    # Penalize screenshot/browser/menu-like junk.
    junk_terms = [
        "share",
        "save",
        "menu",
        "download",
        "label maker",
        "compliant food labels",
        "visit",
        "login",
        "search",
    ]

    for term in junk_terms:
        if term in text:
            score -= 80

    # Penalize high ratio of digits/symbol noise.
    digit_count = len(re.findall(r"\d", text))
    if len(text) > 0 and digit_count / len(text) > 0.18:
        score -= 120

    weird_chars = len(re.findall(r"[^a-z0-9,.;:()/%&+\-'\s]", text))
    score -= weird_chars * 20

    return score


def is_strong_ocr_result(text: str) -> bool:
    """
    Decide whether an OCR result is strong enough to stop early.
    """
    if len(text) < 80:
        return False

    score = score_ocr_text(text)

    has_structure = text.count(",") >= 3 or "contains" in text or "may contain" in text
    has_ingredient_signal = any(
        keyword in text
        for keyword in [
            "milk",
            "wheat",
            "soy",
            "egg",
            "peanut",
            "sugar",
            "salt",
            "oil",
            "flour",
            "lecithin",
            "citric acid",
        ]
    )

    return score >= GOOD_OCR_SCORE and has_structure and has_ingredient_signal


def run_tesseract(image: Image.Image, config: str, timeout: int = 12) -> str:
    """
    Run Tesseract with a specific config and return cleaned text.
    """
    raw_text = pytesseract.image_to_string(
        image,
        config=config,
        timeout=timeout,
    )

    return clean_ocr_text(raw_text)


def extract_text_from_image(file_path: str) -> str:
    """
    Extract cleaned text from an uploaded ingredient label image.

    Uses a balanced strategy:
    - Try likely fastest/good OCR first.
    - Stop early only if the result is clearly ingredient-like.
    - Use selected fallbacks for dense, small, or high-contrast labels.
    """
    start_time = time.perf_counter()

    image = preprocess_image(file_path)

    strategies = [
        ("normal_psm6", image, "--oem 3 --psm 6"),
        ("normal_psm4", image, "--oem 3 --psm 4"),
        ("threshold165_psm6", threshold_image(image, cutoff=165), "--oem 3 --psm 6"),
        ("threshold145_psm6", threshold_image(image, cutoff=145), "--oem 3 --psm 6"),
        ("threshold190_psm6", threshold_image(image, cutoff=190), "--oem 3 --psm 6"),
        ("normal_psm11", image, "--oem 3 --psm 11"),
        ("normal_psm12", image, "--oem 3 --psm 12"),
    ]

    attempts: list[tuple[str, str, int]] = []

    for strategy_name, attempt_image, config in strategies:
        attempt_start = time.perf_counter()

        try:
            text = run_tesseract(attempt_image, config)
        except RuntimeError as error:
            elapsed = time.perf_counter() - attempt_start
            print(f"OCR strategy {strategy_name} failed in {elapsed:.2f}s: {error}")
            continue

        elapsed = time.perf_counter() - attempt_start

        if not text:
            print(f"OCR strategy {strategy_name} returned no text in {elapsed:.2f}s")
            continue

        score = score_ocr_text(text)
        attempts.append((strategy_name, text, score))

        print(
            f"OCR strategy {strategy_name} completed in {elapsed:.2f}s "
            f"with score {score} and length {len(text)}"
        )

        if is_strong_ocr_result(text):
            total_elapsed = time.perf_counter() - start_time
            print(
                f"OCR selected early strategy {strategy_name} "
                f"in {total_elapsed:.2f}s"
            )
            return text

    if not attempts:
        raise ValueError(
            "Could not read text from the image. Try a clearer, closer photo."
        )

    best_strategy, best_text, best_score = max(attempts, key=lambda item: item[2])

    if len(best_text) < MIN_OCR_TEXT_LENGTH:
        raise ValueError(
            "Could not read enough text from the image. Try a clearer, closer photo."
        )

    total_elapsed = time.perf_counter() - start_time
    print(
        f"OCR selected best strategy {best_strategy} "
        f"with score {best_score} in {total_elapsed:.2f}s"
    )

    return best_text
