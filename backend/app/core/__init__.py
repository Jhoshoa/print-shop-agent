"""Core modules - Constants, Exceptions, Logging."""

from app.core.constants import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    CM_TO_EMU,
    LIMITS,
    ORIENTATIONS,
    PAGE_SIZES,
)
from app.core.exceptions import (
    ConfigurationError,
    DocumentGenerationError,
    FileOperationError,
    ImageProcessingError,
    InvalidImageError,
    PrintShopError,
    ValidationError,
)
from app.core.logging import logger, setup_logging


__all__ = [
    # Constants
    "PAGE_SIZES",
    "ORIENTATIONS",
    "ALLOWED_EXTENSIONS",
    "ALLOWED_MIME_TYPES",
    "LIMITS",
    "CM_TO_EMU",
    # Exceptions
    "PrintShopError",
    "ImageProcessingError",
    "InvalidImageError",
    "DocumentGenerationError",
    "FileOperationError",
    "ConfigurationError",
    "ValidationError",
    # Logging
    "logger",
    "setup_logging",
]
