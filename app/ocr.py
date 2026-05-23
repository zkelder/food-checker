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

MIN_OCR_TEXT_LENGTH = 8


def validate_image_upload(file: UploadFile) -> None:
    """
    Validate that the uploaded file is an image type we support.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Unsupported image type. Please upload JPG, PNG, or WEBP.")


def preprocess_image(file_path: str) -> Image.Image:
    """
    Prepare phone label photos for OCR.

    Handles:
    - rotated phone images
    - small text
    - low contrast
    - mild blur
    """
    image = Image.open(file_path)
    image = ImageOps.exif_transpose(image)

    image = image.convert("L")
    image = ImageOps.autocontrast(image)

    width, height = image.size

    if width < 1800:
        scale = 1800 / width
        new_size = (int(width * scale), int(height * scale))
        image = image.resize(new_size)

    image = image.filter(ImageFilter.SHARPEN)
    image = ImageOps.autocontrast(image)

    return image


def threshold_image(image: Image.Image) -> Image.Image:
    """
    Create a high-contrast black-and-white copy for fallback OCR.
    """
    return image.point(lambda pixel: 255 if pixel > 165 else 0)


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
    thresholded = threshold_image(image)

    attempts = [
        run_tesseract(image, "--psm 6"),
        run_tesseract(thresholded, "--psm 6"),
        run_tesseract(image, "--psm 11"),
        run_tesseract(thresholded, "--psm 11"),
    ]

    best_text = max(attempts, key=len)

    if len(best_text) < MIN_OCR_TEXT_LENGTH:
        raise ValueError(
            "Could not read enough text from the image. Try a clearer, closer photo."
        )

    return best_text