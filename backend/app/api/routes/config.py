"""
API routes for configuration.
"""

from fastapi import APIRouter

from app.config import settings
from app.core.constants import ORIENTATIONS, PAGE_SIZES
from app.models import ConfigResponse


router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get(
    "/defaults",
    response_model=ConfigResponse,
    summary="Get default configuration",
    description="Returns default values and available options",
)
async def get_defaults() -> ConfigResponse:
    """Get system default configuration."""
    return ConfigResponse(
        page_sizes=list(PAGE_SIZES.keys()),
        orientations=ORIENTATIONS,
        defaults={
            "page_size": settings.default_page_size,
            "page_orientation": "vertical",
            "image_width_cm": settings.default_image_width_cm,
            "image_height_cm": None,
            "images_per_row": "auto",
            "spacing_cm": settings.default_spacing_cm,
            "margins_cm": settings.default_margins_cm,
            "borders": False,
            "filename": "documento",
        },
    )


@router.get(
    "/page-sizes",
    summary="Get page sizes",
    description="Returns available page sizes with their dimensions",
)
async def get_page_sizes() -> dict:
    """Get available page sizes with dimensions."""
    return {
        name: {
            "width_cm": dims.width,
            "height_cm": dims.height,
            "display_name": f"{name.upper()} ({dims.width} x {dims.height} cm)",
        }
        for name, dims in PAGE_SIZES.items()
    }
