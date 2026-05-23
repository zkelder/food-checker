"""
OCR service layer.

Handles image validation, phone-photo preprocessing, OCR extraction,
and cleanup of noisy OCR text.
"""

import re

import pytesseract
from fastapi import UploadFile
from PIL import Image, ImageOps


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


def validate_image_upload(file: UploadFile) -> None:
    """
    Validate that the uploaded file is an image type we support.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Unsupported image type. Please upload JPG, PNG, or WEBP.")


def preprocess_image(file_path: str) -> Image.Image:
    """
    Prepare phone label photos for OCR.

    Handles common mobile issues:
    - rotated images
    - small text
    - low contrast
    - mild blur
    """
    image = Image.open(file_path)
    image = ImageOps.exif_transpose(image)

    image = image.convert("L")
    image = ImageOps.autocontrast(image)

    width, height = image.size

    if width < 1600:
        scale = 1600 / width
        new_size = (int(width * scale), int(height * scale))
        image = image.resize(new_size)

    image = ImageOps.autocontrast(image)

    # Simple black/white threshold.
    image = image.point(lambda pixel: 255 if pixel > 165 else 0)

    return image


def clean_ocr_text(text: str) -> str:
    """
    Clean raw OCR output without changing ingredient meaning.
    """
    text = text.replace("\n", " ")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'")

    # Fix OCR splitting around hyphenated words: "RIBO- FLAVIN" -> "RIBOFLAVIN"
    text = re.sub(r"([A-Za-z])-\s+([A-Za-z])", r"\1\2", text)

    # Normalize color/additive patterns: "RED #40" -> "RED 40"
    text = re.sub(r"#\s*(\d+)", r"\1", text)

    # Remove repeated whitespace.
    text = re.sub(r"\s+", " ", text)

    # Remove awkward spacing before punctuation.
    text = re.sub(r"\s+([,.;:)])", r"\1", text)

    # Remove awkward spacing after opening punctuation.
    text = re.sub(r"([(:])\s+", r"\1", text)

    return text.strip()


def extract_text_from_image(file_path: str) -> str:
    """
    Extract cleaned text from an uploaded ingredient label image.
    """
    image = preprocess_image(file_path)

    raw_text = pytesseract.image_to_string(
        image,
        config="--psm 6",
    )

    return clean_ocr_text(raw_text)