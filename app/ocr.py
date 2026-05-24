"""
OCR service layer.

Handles image validation, phone-photo preprocessing, OCR extraction,
fallback OCR attempts, and cleanup of noisy OCR text.
"""

import re

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
    """
    image = Image.open(file_path)
    image = ImageOps.exif_transpose(image)

    image = image.convert("L")
    image = ImageOps.autocontrast(image)

    width, height = image.size

    if width < 1800:
        scale = 1800 / width
        image = image.resize((int(width * scale), int(height * scale)))

    image = image.filter(ImageFilter.SHARPEN)
    image = image.filter(ImageFilter.SHARPEN)
    image = ImageOps.autocontrast(image)

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
    ]

    for keyword in ingredient_keywords:
        if keyword in text:
            score += 50

    # Ingredient lists usually contain commas.
    score += text.count(",") * 10

    # Penalize very noisy OCR.
    weird_chars = len(re.findall(r"[^a-z0-9,.;:()/%&+\-'\s]", text))
    score -= weird_chars * 20

    return score


def run_tesseract(image: Image.Image, config: str) -> str:
    """
    Run Tesseract with a specific config and return cleaned text.
    """
    raw_text = pytesseract.image_to_string(
        image,
        config=config,
        timeout=20,
    )

    return clean_ocr_text(raw_text)


def extract_text_from_image(file_path: str) -> str:
    """
    Extract cleaned text from an uploaded ingredient label image.

    Tries multiple OCR strategies because phone label photos can vary widely.
    """
    image = preprocess_image(file_path)

    thresholded_150 = threshold_image(image, cutoff=150)
    thresholded_165 = threshold_image(image, cutoff=165)
    thresholded_185 = threshold_image(image, cutoff=185)

    configs = [
        "--oem 3 --psm 6",
        "--oem 3 --psm 11",
        "--oem 3 --psm 4",
    ]

    attempts = []

    for config in configs:
        attempts.append(run_tesseract(image, config))
        attempts.append(run_tesseract(thresholded_150, config))
        attempts.append(run_tesseract(thresholded_165, config))
        attempts.append(run_tesseract(thresholded_185, config))

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

    return best_text