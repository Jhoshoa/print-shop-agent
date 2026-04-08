"""API module."""

from fastapi import APIRouter

from app.api.routes import config_router, generator_router, health_router


# Router principal que agrupa todos los sub-routers
api_router = APIRouter(prefix="/api")

# Incluir routers
api_router.include_router(health_router)
api_router.include_router(generator_router)
api_router.include_router(config_router)

__all__ = ["api_router"]
