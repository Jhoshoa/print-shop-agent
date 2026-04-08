"""
Custom application exceptions.

Defines specific errors for better handling and clear messages.
"""

from typing import Any


class PrintShopError(Exception):
    """Base exception for application errors."""

    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        detail: str | None = None,
    ) -> None:
        self.message = message
        self.code = code
        self.detail = detail
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        return {
            "success": False,
            "error": self.message,
            "code": self.code,
            "detail": self.detail,
        }


class ImageProcessingError(PrintShopError):
    """Error processing an image."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="IMAGE_PROCESSING_ERROR",
            detail=detail,
        )


class InvalidImageError(PrintShopError):
    """Error when an image is invalid or corrupted."""

    def __init__(self, message: str = "Invalid or corrupted image") -> None:
        super().__init__(
            message=message,
            code="INVALID_IMAGE",
        )


class DocumentGenerationError(PrintShopError):
    """Error generating Word document."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="DOCUMENT_GENERATION_ERROR",
            detail=detail,
        )


class FileOperationError(PrintShopError):
    """Error in file operations."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="FILE_OPERATION_ERROR",
            detail=detail,
        )


class ConfigurationError(PrintShopError):
    """Configuration error."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="CONFIGURATION_ERROR",
            detail=detail,
        )


class ValidationError(PrintShopError):
    """Data validation error."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            detail=detail,
        )
