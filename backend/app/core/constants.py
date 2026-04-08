"""
System constants.

Defines fixed values like page sizes, limits, etc.
"""

from typing import NamedTuple


class PageDimensions(NamedTuple):
    """Page dimensions in centimeters."""

    width: float
    height: float


# Page sizes in centimeters (width x height)
PAGE_SIZES: dict[str, PageDimensions] = {
    "carta": PageDimensions(21.59, 27.94),
    "a4": PageDimensions(21.0, 29.7),
    "a3": PageDimensions(29.7, 42.0),
    "oficio": PageDimensions(21.59, 35.56),
    "legal": PageDimensions(21.59, 35.56),
}

# Valid orientations
ORIENTATIONS = ["vertical", "horizontal"]

# Supported image formats
SUPPORTED_IMAGE_FORMATS = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "image/bmp": [".bmp"],
}

# Allowed MIME types
ALLOWED_MIME_TYPES = list(SUPPORTED_IMAGE_FORMATS.keys())

# Allowed extensions (flat list)
ALLOWED_EXTENSIONS = [ext for exts in SUPPORTED_IMAGE_FORMATS.values() for ext in exts]

# System limits
LIMITS = {
    "min_image_width_cm": 1.0,
    "max_image_width_cm": 30.0,
    "min_image_height_cm": 1.0,
    "max_image_height_cm": 40.0,
    "min_margins_cm": 0.5,
    "max_margins_cm": 5.0,
    "min_spacing_cm": 0.0,
    "max_spacing_cm": 3.0,
    "max_images_per_row": 6,
    "max_images_per_document": 100,
    "max_image_size_bytes": 10 * 1024 * 1024,  # 10MB
    "max_image_dimension": 8000,  # pixels
}

# Unit conversions
CM_TO_EMU = 360000  # 1 cm = 360000 EMUs (English Metric Units)
CM_TO_INCHES = 0.393701
INCHES_TO_CM = 2.54
CM_TO_TWIPS = 566.929  # 1 cm = 566.929 twips

# Border settings
BORDER_COLOR_BLACK = (0, 0, 0)
BORDER_COLOR_GRAY = (128, 128, 128)
BORDER_WIDTH_PT = 1  # Points
