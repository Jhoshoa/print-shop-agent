"""
Shared test fixtures.

Provides common fixtures for all tests.
"""

import base64
import sys
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app
from app.models import DocumentConfig


@pytest.fixture
def client() -> TestClient:
    """Test client for the API."""
    return TestClient(app)


@pytest.fixture
def sample_image_base64() -> str:
    """Generate a test image in base64."""
    # Create red 100x100 image
    img = Image.new("RGB", (100, 100), color="red")

    # Convert to bytes
    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)

    # Encode in base64
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


@pytest.fixture
def sample_image_png_base64() -> str:
    """Generate a test PNG image with transparency in base64."""
    # Create RGBA image with transparency
    img = Image.new("RGBA", (100, 100), color=(255, 0, 0, 128))

    # Convert to bytes
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    # Encode in base64
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


@pytest.fixture
def sample_images_base64(sample_image_base64: str) -> list[str]:
    """List of test images."""
    return [sample_image_base64] * 4


@pytest.fixture
def horizontal_image_base64() -> str:
    """Generate a horizontal test image in base64."""
    img = Image.new("RGB", (200, 100), color="blue")

    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")


@pytest.fixture
def vertical_image_base64() -> str:
    """Generate a vertical test image in base64."""
    img = Image.new("RGB", (100, 200), color="green")

    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")


@pytest.fixture
def default_config() -> DocumentConfig:
    """Default configuration for tests."""
    return DocumentConfig(
        page_size="carta",
        page_orientation="vertical",
        image_width_cm=10.0,
        images_per_row="auto",
        filename="test_document",
    )


@pytest.fixture
def custom_config() -> DocumentConfig:
    """Custom configuration for tests."""
    return DocumentConfig(
        page_size="a4",
        page_orientation="horizontal",
        image_width_cm=7.0,
        images_per_row=3,
        spacing_cm=1.0,
        margins_cm=2.0,
        borders=True,
        filename="custom_test",
    )
