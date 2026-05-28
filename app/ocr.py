"""
OCR service layer.

Handles image validation, phone-photo preprocessing, OCR extraction,
fallback OCR attempts, and cleanup of noisy OCR text.
"""

import re
import time

import pytesseract
from fastapi import UploadFile
from PIL import Image, ImageFilter, ImageOps


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
MIN_OCR_TEXT_LENGTH = 8
GOOD_OCR_SCORE = 350


def validate_image_upload(file: UploadFile) -> None:
    """
    Validate that the uploaded file is an image type and size we support.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Unsupported image type. Please upload JPG, PNG, or WEBP.")

    if file.size and file.size > MAX_IMAGE_SIZE_BYTES:
        raise ValueError("Image is too large. Please upload an image under 8 MB.")


def preprocess_image(file_path: str) -> Image.Image:
    """
    Prepare phone label photos for OCR.

    Keep the image reasonably sized. Do not upscale aggressively because
    mobile already sends a compressed scan image.
    """
    image = Image.open(file_path)
    image = ImageOps.exif_transpose(image)

    max_width = 1400
    width, height = image.size

    if width > max_width:
        scale = max_width / width
        image = image.resize((max_width, int(height * scale)))

    image = image.convert("L")
    image = ImageOps.autocontrast(image)
    image = image.filter(ImageFilter.SHARPEN)

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

    # Remove repeated whitespace.
    text = re.sub(r"\s+", " ", text)

    return text.strip().lower()


def score_ocr_text(text: str) -> int:
    """
    Score OCR attempts by ingredient-like usefulness, not just length.
    """
    score = len(text)

    ingredient_keywords = [
        "milk",
        "wheat",
        "soy",
        "egg",
        "peanut",
        "tree nut",
        "almond",
        "cashew",
        "contains",
        "sugar",
        "salt",
        "oil",
        "flour",
        "corn",
        "natural flavor",
        "citric acid",
        "ingredients",
    ]

    for keyword in ingredient_keywords:
        if keyword in text:
            score += 50

    score += text.count(",") * 10

    weird_chars = len(re.findall(r"[^a-z0-9,.;:()/%&+\-'\s]", text))
    score -= weird_chars * 20

    return score


def run_tesseract(image: Image.Image, config: str, timeout: int = 10) -> str:
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

    Uses a fast-first strategy:
    - Try the normal processed image first.
    - Stop early if the result looks good.
    - Only use fallback thresholding if needed.
    """
    start_time = time.perf_counter()

    image = preprocess_image(file_path)

    attempts: list[str] = []

    strategies = [
        (image, "--oem 3 --psm 6"),
        (threshold_image(image, cutoff=165), "--oem 3 --psm 6"),
        (image, "--oem 3 --psm 11"),
    ]

    for attempt_image, config in strategies:
        text = run_tesseract(attempt_image, config)
        if text:
            attempts.append(text)

            if score_ocr_text(text) >= GOOD_OCR_SCORE:
                elapsed = time.perf_counter() - start_time
                print(f"OCR completed early in {elapsed:.2f}s")
                return text

    attempts = [text for text in attempts if text]

    if not attempts:
        raise ValueError(
            "Could not read text from the image. Try a clearer, closer photo."
        )

    best_text = max(attempts, key=score_ocr_text)

    if len(best_text) < MIN_OCR_TEXT_LENGTH:
        raise ValueError(
            "Could not read enough text from the image. Try a clearer, closer photo."
        )

    elapsed = time.perf_counter() - start_time
    print(f"OCR completed in {elapsed:.2f}s")

    return best_text