"""Application Services."""

from app.services.document_generator import (
    DocumentGenerator,
    GenerationResult,
    document_generator,
)
from app.services.file_manager import FileManager, file_manager
from app.services.image_processor import (
    ImageInfo,
    ImageProcessor,
    ProcessedImage,
    image_processor,
)

__all__ = [
    # Image Processor
    "ImageProcessor",
    "ImageInfo",
    "ProcessedImage",
    "image_processor",
    # Document Generator
    "DocumentGenerator",
    "GenerationResult",
    "document_generator",
    # File Manager
    "FileManager",
    "file_manager",
]
