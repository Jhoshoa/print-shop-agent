"""
Utility helper functions.
"""

from datetime import datetime


def format_file_size(bytes_size: int | float) -> str:
    """
    Format file size in bytes to human readable format.

    Args:
        bytes_size: Size in bytes

    Returns:
        Formatted size (e.g., "1.5 MB")
    """
    if bytes_size == 0:
        return "0 Bytes"

    k = 1024
    sizes = ["Bytes", "KB", "MB", "GB"]
    i = 0

    while bytes_size >= k and i < len(sizes) - 1:
        bytes_size /= k
        i += 1

    return f"{bytes_size:.2f} {sizes[i]}"


def generate_filename(prefix: str = "documento") -> str:
    """
    Generate a unique filename with timestamp.

    Args:
        prefix: Filename prefix

    Returns:
        Unique filename
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}"


def sanitize_filename(name: str) -> str:
    """
    Sanitize a string for use as filename.

    Args:
        name: String to sanitize

    Returns:
        Sanitized string safe for filenames
    """
    # Remove invalid characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, "_")

    # Remove extra spaces and trim
    name = " ".join(name.split())
    name = name.strip()

    # Limit length
    return name[:100] if len(name) > 100 else name
