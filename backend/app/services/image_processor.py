"""
Image processing service.

Handles image decoding, validation, and transformation.
"""

import base64
import io
from dataclasses import dataclass
from typing import Literal

from PIL import Image

from app.core.constants import ALLOWED_MIME_TYPES, LIMITS
from app.core.exceptions import ImageProcessingError, InvalidImageError
from app.core.logging import logger


@dataclass
class ImageInfo:
    """Information about a processed image."""

    width: int
    height: int
    format: str
    mode: str
    orientation: Literal["horizontal", "vertical", "square"]
    size_bytes: int
    aspect_ratio: float


@dataclass
class ProcessedImage:
    """Processed image ready to insert into document."""

    data: bytes
    info: ImageInfo
    stream: io.BytesIO


class ImageProcessor:
    """Image processor for the document generator."""

    def __init__(self) -> None:
        """Initialize the image processor."""
        self._processed_count = 0
        self.max_image_size = LIMITS["max_image_size_bytes"]
        self.max_dimension = LIMITS["max_image_dimension"]

    def decode_base64(self, base64_string: str) -> bytes:
        """
        Decode an image from base64.

        Args:
            base64_string: Image in base64 format (may include data URI)

        Returns:
            Image bytes

        Raises:
            InvalidImageError: If base64 is invalid
        """
        try:
            # Remove data URI prefix if present
            if "," in base64_string:
                # Format: data:image/png;base64,xxxxx
                base64_string = base64_string.split(",", 1)[1]

            # Decode
            image_bytes = base64.b64decode(base64_string)

            # Validate size
            if len(image_bytes) > self.max_image_size:
                size_mb = len(image_bytes) / 1024 / 1024
                max_mb = self.max_image_size / 1024 / 1024
                raise InvalidImageError(
                    f"Image too large: {size_mb:.1f}MB (max: {max_mb:.0f}MB)"
                )

            return image_bytes

        except base64.binascii.Error as e:
            raise InvalidImageError(f"Invalid base64: {e}") from e

    def validate_image(self, image_bytes: bytes) -> Image.Image:
        """
        Validate that bytes are a valid image.

        Args:
            image_bytes: Image bytes

        Returns:
            PIL Image object

        Raises:
            InvalidImageError: If image is invalid or corrupted
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))

            # Verify image can be read
            image.verify()

            # Reopen after verify (verify closes the file)
            image = Image.open(io.BytesIO(image_bytes))

            # Validate format
            if image.format:
                mime_type = Image.MIME.get(image.format, "")
                if mime_type and mime_type not in ALLOWED_MIME_TYPES:
                    raise InvalidImageError(
                        f"Unsupported format: {image.format}. "
                        "Valid formats: JPEG, PNG, WEBP, GIF, BMP"
                    )

            # Validate dimensions
            if image.width > self.max_dimension or image.height > self.max_dimension:
                raise InvalidImageError(
                    f"Image too large: {image.width}x{image.height}. "
                    f"Maximum: {self.max_dimension}x{self.max_dimension}"
                )

            return image

        except InvalidImageError:
            raise
        except Exception as e:
            raise InvalidImageError(f"Corrupted or invalid image: {e}") from e

    def get_orientation(
        self, width: int, height: int
    ) -> Literal["horizontal", "vertical", "square"]:
        """
        Determine the orientation of an image.

        Args:
            width: Width in pixels
            height: Height in pixels

        Returns:
            Orientation: 'horizontal', 'vertical', or 'square'
        """
        ratio = width / height

        if ratio > 1.1:
            return "horizontal"
        elif ratio < 0.9:
            return "vertical"
        else:
            return "square"

    def get_image_info(self, image: Image.Image, size_bytes: int) -> ImageInfo:
        """
        Get detailed information about an image.

        Args:
            image: PIL Image object
            size_bytes: Size in bytes

        Returns:
            ImageInfo with details
        """
        return ImageInfo(
            width=image.width,
            height=image.height,
            format=image.format or "UNKNOWN",
            mode=image.mode,
            orientation=self.get_orientation(image.width, image.height),
            size_bytes=size_bytes,
            aspect_ratio=round(image.width / image.height, 3),
        )

    def convert_to_rgb(self, image: Image.Image) -> Image.Image:
        """
        Convert image to RGB if necessary.

        Necessary for inserting some PNG images with transparency into Word.

        Args:
            image: PIL Image object

        Returns:
            Image in RGB mode
        """
        if image.mode in ("RGBA", "LA", "P"):
            # Create white background
            background = Image.new("RGB", image.size, (255, 255, 255))

            if image.mode == "P":
                image = image.convert("RGBA")

            if image.mode in ("RGBA", "LA"):
                # Paste with alpha mask
                alpha = image.split()[-1]
                background.paste(image, mask=alpha)
                return background

        if image.mode != "RGB":
            return image.convert("RGB")

        return image

    def resize_if_needed(
        self,
        image: Image.Image,
        max_width: int = 2000,
        max_height: int = 2000,
    ) -> Image.Image:
        """
        Resize image if it exceeds limits.

        Maintains aspect ratio.

        Args:
            image: PIL Image object
            max_width: Maximum width
            max_height: Maximum height

        Returns:
            Resized image or original if within limits
        """
        if image.width <= max_width and image.height <= max_height:
            return image

        # Calculate new size maintaining aspect ratio
        ratio = min(max_width / image.width, max_height / image.height)
        new_width = int(image.width * ratio)
        new_height = int(image.height * ratio)

        logger.debug(
            f"Resizing image: {image.width}x{image.height} -> {new_width}x{new_height}"
        )

        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    def process_image(
        self,
        base64_string: str,
        resize: bool = True,
    ) -> ProcessedImage:
        """
        Process a complete image: decode, validate, and prepare.

        Args:
            base64_string: Image in base64
            resize: Whether to resize large images

        Returns:
            ProcessedImage ready to use

        Raises:
            ImageProcessingError: If there's an error in processing
        """
        try:
            # 1. Decode base64
            image_bytes = self.decode_base64(base64_string)

            # 2. Validate image
            image = self.validate_image(image_bytes)

            # 3. Get info before transforming
            original_info = self.get_image_info(image, len(image_bytes))

            # 4. Convert to RGB if necessary
            image = self.convert_to_rgb(image)

            # 5. Resize if necessary
            if resize:
                image = self.resize_if_needed(image)

            # 6. Convert to bytes (JPEG for better Word compatibility)
            output_buffer = io.BytesIO()
            image.save(output_buffer, format="JPEG", quality=95, optimize=True)
            final_bytes = output_buffer.getvalue()

            # 7. Create stream for python-docx
            output_buffer.seek(0)

            self._processed_count += 1

            logger.debug(
                f"Image processed #{self._processed_count}: "
                f"{original_info.width}x{original_info.height} "
                f"({original_info.orientation})"
            )

            return ProcessedImage(
                data=final_bytes,
                info=original_info,
                stream=output_buffer,
            )

        except (InvalidImageError, ImageProcessingError):
            raise
        except Exception as e:
            raise ImageProcessingError(
                f"Error processing image: {e}",
                detail=str(type(e).__name__),
            ) from e

    def process_multiple(
        self,
        base64_images: list[str],
        resize: bool = True,
    ) -> list[ProcessedImage]:
        """
        Process multiple images.

        Args:
            base64_images: List of images in base64
            resize: Whether to resize large images

        Returns:
            List of ProcessedImage

        Raises:
            ImageProcessingError: If there's an error in any image
        """
        processed: list[ProcessedImage] = []

        for i, base64_img in enumerate(base64_images):
            try:
                processed_img = self.process_image(base64_img, resize=resize)
                processed.append(processed_img)
            except (InvalidImageError, ImageProcessingError) as e:
                raise ImageProcessingError(
                    f"Error in image {i + 1}: {e.message}",
                    detail=e.detail,
                ) from e

        logger.info(f"Processed {len(processed)} images successfully")
        return processed

    @property
    def processed_count(self) -> int:
        """Number of images processed."""
        return self._processed_count


# Singleton instance
image_processor = ImageProcessor()
