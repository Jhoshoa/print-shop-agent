"""
Application configuration using Pydantic Settings.

Loads configuration from environment variables and .env file.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Main application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="Print Shop Generator")
    app_version: str = Field(default="1.0.0")
    app_env: Literal["development", "production", "testing"] = Field(default="development")

    # Server
    host: str = Field(default="127.0.0.1")
    port: int = Field(default=8000)
    reload: bool = Field(default=True)

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(default="INFO")
    log_format: Literal["pretty", "json"] = Field(default="pretty")

    # Paths
    output_dir: Path = Field(default=Path("./output"))

    # Limits
    max_file_size_mb: int = Field(default=50)
    max_images_per_request: int = Field(default=100)
    cleanup_days: int = Field(default=7)

    # Default Document Settings
    default_page_size: str = Field(default="carta")
    default_image_width_cm: float = Field(default=10.0)
    default_margins_cm: float = Field(default=1.5)
    default_spacing_cm: float = Field(default=0.5)

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env == "production"

    def get_output_path(self) -> Path:
        """Get output path, creating it if it doesn't exist."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        return self.output_dir


@lru_cache
def get_settings() -> Settings:
    """
    Get settings instance (singleton).

    Uses lru_cache to avoid reloading configuration on each call.
    """
    return Settings()


# Global instance for direct import
settings = get_settings()
