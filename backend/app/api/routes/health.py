"""
Health check and system status routes.
"""

import importlib.util
import platform
from datetime import datetime

from fastapi import APIRouter

from app.config import settings
from app.models import HealthResponse
from app.services import file_manager


router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "",
    response_model=HealthResponse,
    summary="Health Check",
    description="Verifies the application is running",
)
async def health_check() -> HealthResponse:
    """Verify the application is working."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        environment=settings.app_env,
    )


@router.get(
    "/status",
    summary="System Status",
    description="Returns detailed system status information",
)
async def system_status() -> dict:
    """Get detailed system status."""
    disk_usage = file_manager.get_disk_usage()

    # Try to get system info
    try:
        import psutil

        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        system_info = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": round(memory.available / 1024 / 1024, 2),
        }
    except ImportError:
        system_info = {"note": "psutil not installed for detailed system info"}

    return {
        "application": {
            "name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.app_env,
            "python_version": platform.python_version(),
        },
        "system": system_info,
        "storage": disk_usage,
        "limits": {
            "max_file_size_mb": settings.max_file_size_mb,
            "max_images_per_request": settings.max_images_per_request,
        },
        "timestamp": datetime.now().isoformat(),
    }


@router.get(
    "/ready",
    summary="Readiness Check",
    description="Verifies the application is ready to receive traffic",
)
async def readiness_check() -> dict:
    """
    Readiness check - verifies the application is ready.
    """
    checks = {
        "output_dir_exists": False,
        "output_dir_writable": False,
        "dependencies_ok": False,
    }

    # Verify output directory exists
    output_dir = settings.get_output_path()
    checks["output_dir_exists"] = output_dir.exists()

    # Verify output directory is writable
    try:
        test_file = output_dir / ".write_test"
        test_file.write_text("test")
        test_file.unlink()
        checks["output_dir_writable"] = True
    except Exception:
        pass

    # Verify critical dependencies
    docx_available = importlib.util.find_spec("docx") is not None
    pil_available = importlib.util.find_spec("PIL") is not None
    checks["dependencies_ok"] = docx_available and pil_available

    is_ready = all(checks.values())

    return {
        "ready": is_ready,
        "checks": checks,
        "timestamp": datetime.now().isoformat(),
    }
