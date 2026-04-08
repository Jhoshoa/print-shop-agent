"""
Pydantic models for API requests.

Defines the structure of data we expect to receive in API endpoints.
"""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class DocumentConfig(BaseModel):
    """Configuration for document generation."""

    page_size: Literal["carta", "a4", "a3", "oficio", "legal"] = Field(
        default="carta",
        description="Page size for the document",
    )
    page_orientation: Literal["vertical", "horizontal"] = Field(
        default="vertical",
        description="Page orientation",
    )
    image_width_cm: float = Field(
        default=9.1,
        ge=1.0,
        le=30.0,
        description="Width of each image in centimeters",
    )
    image_height_cm: float | None = Field(
        default=None,
        ge=1.0,
        le=40.0,
        description="Height of each image in cm. If None, calculated proportionally",
    )
    images_per_row: int | Literal["auto"] = Field(
        default="auto",
        description="Number of images per row. 'auto' calculates based on width",
    )
    spacing_cm: float = Field(
        default=0.5,
        ge=0.0,
        le=3.0,
        description="Space between images in centimeters",
    )
    margins_cm: float = Field(
        default=1.27,
        ge=0.5,
        le=5.0,
        description="Page margins in centimeters",
    )
    borders: bool = Field(
        default=False,
        description="Add borders to images",
    )
    filename: str = Field(
        default="documento",
        min_length=1,
        max_length=100,
        description="Output filename without extension",
    )
    image_alignment: Literal["left", "center", "right"] = Field(
        default="left",
        description="Horizontal alignment of images: left, center, or right",
    )
    image_layout: Literal["vertical", "inline"] = Field(
        default="vertical",
        description="Image layout: vertical (one per line with line breaks) or inline (side by side)",
    )

    @field_validator("filename")
    @classmethod
    def sanitize_filename(cls, v: str) -> str:
        """Remove invalid characters from filename."""
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            v = v.replace(char, "_")
        return v.strip()

    @field_validator("images_per_row", mode="before")
    @classmethod
    def validate_images_per_row(cls, v: int | str) -> int | str:
        """Validate that images_per_row is 'auto' or a valid integer."""
        if isinstance(v, str):
            if v.lower() == "auto":
                return "auto"
            try:
                return int(v)
            except ValueError:
                return "auto"
        if isinstance(v, int) and v < 1:
            return "auto"
        return v


class GenerateDocumentRequest(BaseModel):
    """Request to generate a document with images."""

    images: list[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of images in base64 format",
    )
    config: DocumentConfig = Field(
        default_factory=DocumentConfig,
        description="Document configuration",
    )

    @field_validator("images")
    @classmethod
    def validate_images(cls, v: list[str]) -> list[str]:
        """Validate that images are not empty."""
        if not v:
            raise ValueError("At least one image must be provided")
        # Validate each image has content
        for i, img in enumerate(v):
            if not img or len(img) < 100:  # Reasonable minimum for base64
                raise ValueError(f"Image {i + 1} is empty or invalid")
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "images": ["base64_encoded_image_data..."],
                    "config": {
                        "page_size": "carta",
                        "image_width_cm": 10,
                        "images_per_row": "auto",
                        "filename": "mi_documento",
                    },
                }
            ]
        }
    }
