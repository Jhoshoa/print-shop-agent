"""API Routes."""

from app.api.routes.config import router as config_router
from app.api.routes.generator import router as generator_router
from app.api.routes.health import router as health_router

__all__ = ["generator_router", "config_router", "health_router"]
