"""
File management service.

Handles file operations: cleanup, listing, etc.
"""

from datetime import datetime, timedelta
from pathlib import Path

from app.config import settings
from app.core.exceptions import FileOperationError
from app.core.logging import logger


class FileManager:
    """File manager for the system."""

    def __init__(self, output_dir: Path | None = None) -> None:
        """
        Initialize file manager.

        Args:
            output_dir: Directory for generated files
        """
        self.output_dir = output_dir or settings.get_output_path()

    def get_file_path(self, filename: str) -> Path:
        """
        Get full path of a file.

        Args:
            filename: File name

        Returns:
            Full path

        Raises:
            FileOperationError: If file doesn't exist
        """
        file_path = self.output_dir / filename

        if not file_path.exists():
            raise FileOperationError(f"File not found: {filename}")

        return file_path

    def list_files(
        self,
        extension: str = ".docx",
        limit: int = 50,
    ) -> list[dict]:
        """
        List generated files.

        Args:
            extension: Extension to filter
            limit: Maximum number of files

        Returns:
            List of dictionaries with file information
        """
        files = []

        for file_path in sorted(
            self.output_dir.glob(f"*{extension}"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )[:limit]:
            try:
                stat = file_path.stat()
                files.append(
                    {
                        "filename": file_path.name,
                        "size_kb": round(stat.st_size / 1024, 2),
                        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    }
                )
            except OSError:
                continue

        return files

    def delete_file(self, filename: str) -> bool:
        """
        Delete a file.

        Args:
            filename: File name

        Returns:
            True if deleted successfully

        Raises:
            FileOperationError: If error deleting
        """
        try:
            file_path = self.get_file_path(filename)
            file_path.unlink()
            logger.info(f"File deleted: {filename}")
            return True
        except FileOperationError:
            raise
        except Exception as e:
            raise FileOperationError(f"Error deleting file: {e}") from e

    def cleanup_old_files(
        self,
        days: int | None = None,
        extension: str = ".docx",
    ) -> int:
        """
        Delete files older than X days.

        Args:
            days: Days of retention (default: settings.cleanup_days)
            extension: File extension to clean

        Returns:
            Number of files deleted
        """
        days = days or settings.cleanup_days
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0

        for file_path in self.output_dir.glob(f"*{extension}"):
            try:
                file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)

                if file_mtime < cutoff_date:
                    file_path.unlink()
                    deleted_count += 1
                    logger.debug(f"Old file deleted: {file_path.name}")
            except Exception as e:
                logger.warning(f"Could not delete {file_path.name}: {e}")

        if deleted_count > 0:
            logger.info(f"Cleanup completed: {deleted_count} files deleted")

        return deleted_count

    def get_disk_usage(self) -> dict:
        """
        Get disk usage information.

        Returns:
            Dictionary with usage information
        """
        total_size = 0
        file_count = 0

        for file_path in self.output_dir.glob("*"):
            if file_path.is_file():
                try:
                    total_size += file_path.stat().st_size
                    file_count += 1
                except OSError:
                    continue

        return {
            "total_files": file_count,
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "output_dir": str(self.output_dir.absolute()),
        }


# Singleton instance
file_manager = FileManager()
