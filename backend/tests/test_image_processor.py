"""
Tests for the image processing service.
"""

import base64
from io import BytesIO

import pytest
from PIL import Image

from app.core.exceptions import InvalidImageError
from app.services.image_processor import ImageProcessor, image_processor


class TestImageProcessor:
    """Tests for ImageProcessor."""

    def test_decode_valid_base64(self, sample_image_base64: str) -> None:
        """Test decoding valid base64."""
        result = image_processor.decode_base64(sample_image_base64)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_decode_with_data_uri(self, sample_image_base64: str) -> None:
        """Test decoding with data URI prefix."""
        data_uri = f"data:image/jpeg;base64,{sample_image_base64}"
        result = image_processor.decode_base64(data_uri)
        assert isinstance(result, bytes)

    def test_decode_invalid_base64(self) -> None:
        """Test error with invalid base64."""
        with pytest.raises(InvalidImageError):
            image_processor.decode_base64("not-valid-base64!!!")

    def test_validate_valid_image(self, sample_image_base64: str) -> None:
        """Test validation of valid image."""
        image_bytes = image_processor.decode_base64(sample_image_base64)
        result = image_processor.validate_image(image_bytes)
        assert isinstance(result, Image.Image)

    def test_validate_invalid_image(self) -> None:
        """Test error with invalid image."""
        with pytest.raises(InvalidImageError):
            image_processor.validate_image(b"not an image")

    def test_get_orientation_horizontal(self) -> None:
        """Test horizontal orientation detection."""
        result = image_processor.get_orientation(200, 100)
        assert result == "horizontal"

    def test_get_orientation_vertical(self) -> None:
        """Test vertical orientation detection."""
        result = image_processor.get_orientation(100, 200)
        assert result == "vertical"

    def test_get_orientation_square(self) -> None:
        """Test square orientation detection."""
        result = image_processor.get_orientation(100, 100)
        assert result == "square"

    def test_convert_to_rgb_from_rgba(self, sample_image_png_base64: str) -> None:
        """Test conversion from RGBA to RGB."""
        image_bytes = image_processor.decode_base64(sample_image_png_base64)
        image = Image.open(BytesIO(image_bytes))

        result = image_processor.convert_to_rgb(image)
        assert result.mode == "RGB"

    def test_process_image_complete(self, sample_image_base64: str) -> None:
        """Test complete image processing."""
        result = image_processor.process_image(sample_image_base64)

        assert result.data is not None
        assert len(result.data) > 0
        assert result.info.width == 100
        assert result.info.height == 100
        assert result.info.orientation == "square"
        assert result.stream is not None

    def test_process_multiple_images(self, sample_images_base64: list[str]) -> None:
        """Test processing multiple images."""
        result = image_processor.process_multiple(sample_images_base64)

        assert len(result) == 4
        for processed in result:
            assert processed.data is not None
            assert processed.info is not None

    def test_process_horizontal_image(self, horizontal_image_base64: str) -> None:
        """Test processing horizontal image."""
        result = image_processor.process_image(horizontal_image_base64)

        assert result.info.orientation == "horizontal"
        assert result.info.width > result.info.height

    def test_process_vertical_image(self, vertical_image_base64: str) -> None:
        """Test processing vertical image."""
        result = image_processor.process_image(vertical_image_base64)

        assert result.info.orientation == "vertical"
        assert result.info.height > result.info.width

    def test_resize_large_image(self) -> None:
        """Test resizing a large image."""
        # Create large image
        img = Image.new("RGB", (4000, 3000), color="red")

        processor = ImageProcessor()
        resized = processor.resize_if_needed(img, max_width=2000, max_height=2000)

        assert resized.width <= 2000
        assert resized.height <= 2000

    def test_no_resize_small_image(self) -> None:
        """Test that small images are not resized."""
        img = Image.new("RGB", (500, 400), color="red")

        processor = ImageProcessor()
        result = processor.resize_if_needed(img, max_width=2000, max_height=2000)

        assert result.width == 500
        assert result.height == 400
