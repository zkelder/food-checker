from io import BytesIO
import os

import pytest

from app.ocr import (
    MAX_IMAGE_SIZE_BYTES,
    save_upload_to_temp_file,
    validate_image_upload,
)


class FakeUpload:
    def __init__(
        self,
        data: bytes = b"",
        *,
        content_type: str = "image/jpeg",
        size: int | None = None,
    ):
        self.content_type = content_type
        self.size = size
        self.file = BytesIO(data)


def test_validate_image_upload_rejects_unsupported_content_type():
    upload = FakeUpload(content_type="text/plain")

    with pytest.raises(ValueError) as error:
        validate_image_upload(upload)

    assert "Unsupported image type" in str(error.value)


def test_validate_image_upload_rejects_declared_large_file():
    upload = FakeUpload(size=MAX_IMAGE_SIZE_BYTES + 1)

    with pytest.raises(ValueError) as error:
        validate_image_upload(upload)

    assert "under 8 MB" in str(error.value)


def test_save_upload_to_temp_file_writes_supported_size():
    upload = FakeUpload(b"label image bytes")
    temp_path = save_upload_to_temp_file(upload, ".jpg")

    try:
        with open(temp_path, "rb") as temp_file:
            assert temp_file.read() == b"label image bytes"
    finally:
        os.remove(temp_path)


def test_save_upload_to_temp_file_rejects_streamed_large_file():
    upload = FakeUpload(b"x" * (MAX_IMAGE_SIZE_BYTES + 1), size=None)

    with pytest.raises(ValueError) as error:
        save_upload_to_temp_file(upload, ".jpg")

    assert "under 8 MB" in str(error.value)
