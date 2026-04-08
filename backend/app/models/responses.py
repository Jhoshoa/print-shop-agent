"""
Pydantic models for API responses.

Defines the structure of data returned from API endpoints.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class GenerateDocumentResponse(BaseModel):
    """Successful document generation response."""

    success: bool = Field(default=True)
    filename: str = Field(description="Generated filename")
    path: str = Field(description="Full file path")
    pages: int = Field(description="Number of pages in document")
    images_placed: int = Field(description="Number of images placed")
    file_size_kb: float = Field(description="File size in KB")
    created_at: datetime = Field(default_factory=datetime.now)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "filename": "documento_20240115_143052.docx",
                    "path": "C:/output/documento_20240115_143052.docx",
                    "pages": 3,
                    "images_placed": 12,
                    "file_size_kb": 1024.5,
                    "created_at": "2024-01-15T14:30:52",
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """Error response model."""

    success: bool = Field(default=False)
    error: str = Field(description="Error message")
    detail: str | None = Field(default=None, description="Additional error details")
    code: str = Field(description="Internal error code")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": False,
                    "error": "Invalid image format",
                    "detail": "Only JPEG, PNG, and WEBP are supported",
                    "code": "INVALID_IMAGE",
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(default="healthy")
    version: str = Field(description="Application version")
    environment: str = Field(description="Current environment")
    timestamp: datetime = Field(default_factory=datetime.now)


class ConfigResponse(BaseModel):
    """Configuration response with available options."""

    page_sizes: list[str] = Field(description="Available page sizes")
    orientations: list[str] = Field(description="Available orientations")
    defaults: dict = Field(description="Default configuration values")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "page_sizes": ["carta", "a4", "a3", "oficio", "legal"],
                    "orientations": ["vertical", "horizontal"],
                    "defaults": {
                        "page_size": "carta",
                        "image_width_cm": 10,
                        "margins_cm": 1.5,
                    },
                }
            ]
        }
    }


class FileListResponse(BaseModel):
    """Response with list of generated files."""

    files: list[dict] = Field(description="List of file information")
    count: int = Field(description="Total number of files")


class DeleteFileResponse(BaseModel):
    """Response for file deletion."""

    success: bool = Field(default=True)
    message: str = Field(description="Result message")
