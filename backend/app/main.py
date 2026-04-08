"""
Main FastAPI Application.

Entry point for the Print Shop Generator API.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.config import settings
from app.core.exceptions import PrintShopError
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle.

    - Startup: initialization
    - Shutdown: cleanup
    """
    # === STARTUP ===
    logger.info("=" * 50)
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"Output dir: {settings.get_output_path()}")
    logger.info("=" * 50)

    yield

    # === SHUTDOWN ===
    logger.info("Shutting down application...")


def create_app() -> FastAPI:
    """
    Factory function to create FastAPI application.

    Returns:
        Configured FastAPI instance
    """
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="API for generating Word documents with images for print shops",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
    )

    # === MIDDLEWARE ===

    # CORS - allow requests from frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.is_development else ["http://localhost:8000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # === EXCEPTION HANDLERS ===

    @app.exception_handler(PrintShopError)
    async def print_shop_error_handler(
        request: Request,
        exc: PrintShopError,
    ) -> JSONResponse:
        """Handle custom application exceptions."""
        logger.warning(f"PrintShopError: {exc.code} - {exc.message}")
        return JSONResponse(
            status_code=400,
            content=exc.to_dict(),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Handle uncontrolled exceptions."""
        logger.exception(f"Unhandled error: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error",
                "code": "INTERNAL_ERROR",
                "detail": str(exc) if settings.is_development else None,
            },
        )

    # === ROUTES ===

    # API routes
    app.include_router(api_router)

    # Serve static frontend
    frontend_path = Path(__file__).parent.parent.parent / "frontend"
    if frontend_path.exists():
        app.mount(
            "/",
            StaticFiles(directory=str(frontend_path), html=True),
            name="frontend",
        )
        logger.info(f"Serving frontend from: {frontend_path}")
    else:
        logger.warning(f"Frontend directory not found: {frontend_path}")

        # Root endpoint if no frontend
        @app.get("/")
        async def root():
            return {
                "name": settings.app_name,
                "version": settings.app_version,
                "docs": "/docs" if settings.is_development else None,
                "health": "/api/health",
            }

    return app


# Create application instance
app = create_app()


# === FOR DEVELOPMENT ===
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )
