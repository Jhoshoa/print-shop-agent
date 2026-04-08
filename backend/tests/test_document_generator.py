"""
Tests for the document generator service.
"""

from app.models import DocumentConfig
from app.services import document_generator, image_processor


class TestDocumentGenerator:
    """Tests for DocumentGenerator."""

    def test_generate_single_image(
        self,
        sample_image_base64: str,
        default_config: DocumentConfig,
    ) -> None:
        """Test generation with a single image."""
        # Process image
        processed = image_processor.process_image(sample_image_base64)

        # Generate document
        result = document_generator.generate([processed], default_config)

        assert result.filename.startswith("test_document_")
        assert result.filename.endswith(".docx")
        assert result.images_placed == 1
        assert result.path.exists()
        assert result.file_size_bytes > 0

        # Cleanup
        result.path.unlink()

    def test_generate_multiple_images(
        self,
        sample_images_base64: list[str],
        default_config: DocumentConfig,
    ) -> None:
        """Test generation with multiple images."""
        # Process images
        processed = image_processor.process_multiple(sample_images_base64)

        # Generate document
        result = document_generator.generate(processed, default_config)

        assert result.images_placed == 4
        assert result.path.exists()
        assert result.pages >= 1

        # Cleanup
        result.path.unlink()

    def test_generate_with_borders(
        self,
        sample_image_base64: str,
    ) -> None:
        """Test generation with borders."""
        processed = image_processor.process_image(sample_image_base64)

        config = DocumentConfig(
            borders=True,
            filename="test_borders",
        )

        result = document_generator.generate([processed], config)

        assert result.path.exists()
        result.path.unlink()

    def test_different_page_sizes(
        self,
        sample_image_base64: str,
    ) -> None:
        """Test generation with different page sizes."""
        processed = image_processor.process_image(sample_image_base64)

        for page_size in ["carta", "a4", "a3", "oficio"]:
            config = DocumentConfig(
                page_size=page_size,
                filename=f"test_{page_size}",
            )
            result = document_generator.generate([processed], config)

            assert result.path.exists()
            result.path.unlink()

    def test_horizontal_orientation(
        self,
        sample_image_base64: str,
    ) -> None:
        """Test generation with horizontal orientation."""
        processed = image_processor.process_image(sample_image_base64)

        config = DocumentConfig(
            page_orientation="horizontal",
            filename="test_horizontal",
        )

        result = document_generator.generate([processed], config)

        assert result.path.exists()
        result.path.unlink()

    def test_custom_image_width(
        self,
        sample_image_base64: str,
    ) -> None:
        """Test generation with custom image width."""
        processed = image_processor.process_image(sample_image_base64)

        config = DocumentConfig(
            image_width_cm=5.0,
            filename="test_width",
        )

        result = document_generator.generate([processed], config)

        assert result.path.exists()
        result.path.unlink()

    def test_fixed_images_per_row(
        self,
        sample_images_base64: list[str],
    ) -> None:
        """Test generation with fixed images per row."""
        processed = image_processor.process_multiple(sample_images_base64)

        config = DocumentConfig(
            images_per_row=2,
            filename="test_per_row",
        )

        result = document_generator.generate(processed, config)

        assert result.path.exists()
        result.path.unlink()

    def test_generate_many_images(
        self,
        sample_image_base64: str,
    ) -> None:
        """Test generation with many images."""
        # Create 12 images
        images_base64 = [sample_image_base64] * 12
        processed = image_processor.process_multiple(images_base64)

        config = DocumentConfig(
            image_width_cm=5.0,
            images_per_row=4,
            filename="test_many",
        )

        result = document_generator.generate(processed, config)

        assert result.images_placed == 12
        assert result.pages >= 1
        assert result.path.exists()

        # Cleanup
        result.path.unlink()

    def test_calculate_images_per_row_auto(self) -> None:
        """Test automatic images per row calculation."""
        from app.services.document_generator import DocumentGenerator

        generator = DocumentGenerator()

        # With 10cm images on Carta (21.59cm), margins 1.5cm each side
        # Available: 21.59 - 3 = 18.59cm
        # Images that fit: 18.59 / 10.5 = 1.77 -> 1
        config = DocumentConfig(image_width_cm=10.0, margins_cm=1.5, spacing_cm=0.5)
        result = generator._calculate_images_per_row(config, 21.59)

        assert result == 1

        # With 5cm images
        config2 = DocumentConfig(image_width_cm=5.0, margins_cm=1.5, spacing_cm=0.5)
        result2 = generator._calculate_images_per_row(config2, 21.59)

        assert result2 >= 3
