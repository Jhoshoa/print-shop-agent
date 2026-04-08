"""Pydantic Models for requests and responses."""

from app.models.requests import (
    DocumentConfig,
    GenerateDocumentRequest,
)
from app.models.responses import (
    ConfigResponse,
    ErrorResponse,
    GenerateDocumentResponse,
    HealthResponse,
)


__all__ = [
    # Requests
    "DocumentConfig",
    "GenerateDocumentRequest",
    # Responses
    "GenerateDocumentResponse",
    "ErrorResponse",
    "HealthResponse",
    "ConfigResponse",
]
