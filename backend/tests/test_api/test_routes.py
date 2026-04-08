"""
Tests for API routes.
"""

from fastapi.testclient import TestClient


class TestHealthRoutes:
    """Tests for health check routes."""

    def test_health_check(self, client: TestClient) -> None:
        """Test health check endpoint."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "environment" in data

    def test_system_status(self, client: TestClient) -> None:
        """Test system status endpoint."""
        response = client.get("/api/health/status")

        assert response.status_code == 200
        data = response.json()
        assert "application" in data
        assert "storage" in data
        assert "limits" in data

    def test_readiness_check(self, client: TestClient) -> None:
        """Test readiness check endpoint."""
        response = client.get("/api/health/ready")

        assert response.status_code == 200
        data = response.json()
        assert "ready" in data
        assert "checks" in data


class TestConfigRoutes:
    """Tests for configuration routes."""

    def test_get_defaults(self, client: TestClient) -> None:
        """Test getting default configuration."""
        response = client.get("/api/config/defaults")

        assert response.status_code == 200
        data = response.json()
        assert "page_sizes" in data
        assert "carta" in data["page_sizes"]
        assert "defaults" in data
        assert data["defaults"]["page_size"] == "carta"

    def test_get_page_sizes(self, client: TestClient) -> None:
        """Test getting page sizes."""
        response = client.get("/api/config/page-sizes")

        assert response.status_code == 200
        data = response.json()
        assert "carta" in data
        assert "width_cm" in data["carta"]
        assert "height_cm" in data["carta"]
        assert data["carta"]["width_cm"] == 21.59


class TestGeneratorRoutes:
    """Tests for generator routes."""

    def test_generate_document(
        self,
        client: TestClient,
        sample_images_base64: list[str],
    ) -> None:
        """Test document generation."""
        response = client.post(
            "/api/generator/generate",
            json={
                "images": sample_images_base64,
                "config": {
                    "page_size": "carta",
                    "image_width_cm": 10,
                    "filename": "test_api",
                },
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["images_placed"] == 4
        assert "filename" in data
        assert data["filename"].startswith("test_api_")

    def test_generate_empty_images(self, client: TestClient) -> None:
        """Test error with empty images list."""
        response = client.post(
            "/api/generator/generate",
            json={"images": []},
        )

        assert response.status_code == 422  # Validation error

    def test_generate_invalid_base64(self, client: TestClient) -> None:
        """Test error with invalid base64."""
        response = client.post(
            "/api/generator/generate",
            json={"images": ["not-valid-base64"]},
        )

        assert response.status_code == 422  # Validation error (min length)

    def test_list_files(self, client: TestClient) -> None:
        """Test listing files."""
        response = client.get("/api/generator/files")

        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert "count" in data
        assert isinstance(data["files"], list)

    def test_download_nonexistent_file(self, client: TestClient) -> None:
        """Test downloading nonexistent file."""
        response = client.get("/api/generator/download/nonexistent.docx")

        assert response.status_code == 404

    def test_delete_nonexistent_file(self, client: TestClient) -> None:
        """Test deleting nonexistent file."""
        response = client.delete("/api/generator/files/nonexistent.docx")

        assert response.status_code == 404

    def test_generate_with_all_options(
        self,
        client: TestClient,
        sample_images_base64: list[str],
    ) -> None:
        """Test generation with all configuration options."""
        response = client.post(
            "/api/generator/generate",
            json={
                "images": sample_images_base64,
                "config": {
                    "page_size": "a4",
                    "page_orientation": "horizontal",
                    "image_width_cm": 7,
                    "images_per_row": 2,
                    "spacing_cm": 1.0,
                    "margins_cm": 2.0,
                    "borders": True,
                    "filename": "test_full_options",
                },
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["images_placed"] == 4
